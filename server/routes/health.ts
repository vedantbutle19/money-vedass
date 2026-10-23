import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

// GET /api/financial-health
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Get accounts strictly for this user
    const accounts = await db.prepare('SELECT * FROM accounts WHERE user_id = ?').all(userId) as any[];
    const liquidBalance = accounts
      .filter((a) => ['Bank', 'Cash', 'Wallet', 'checking', 'savings'].includes(a.type.toLowerCase()) && a.balance > 0)
      .reduce((sum, a) => sum + Number(a.balance), 0);
    const investmentBalance = accounts
      .filter((a) => a.type.toLowerCase() === 'investment')
      .reduce((sum, a) => sum + Number(a.balance), 0);
    const debtBalance = accounts
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0);

    // Get monthly transactions strictly for this user
    const transactions = await db
      .prepare("SELECT * FROM transactions WHERE user_id = ? AND strftime('%Y-%m', date) = ?")
      .all(userId, monthStr) as any[];

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const t of transactions) {
      if (t.type === 'income') monthlyIncome += Number(t.amount);
      if (t.type === 'expense') monthlyExpenses += Number(t.amount);
    }

    if (monthlyIncome === 0) {
      monthlyIncome = req.user!.monthlyIncomeBaseline || 0;
    }

    const netSavings = Math.max(0, monthlyIncome - monthlyExpenses);
    const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
    const savingsRateScore = monthlyIncome > 0 ? Math.min(100, Math.round((savingsRate / 40) * 100)) : 50;

    // Budgets performance strictly for this user
    const budgets = await db
      .prepare('SELECT * FROM budgets WHERE user_id = ? AND month = ? AND year = ?')
      .all(userId, currentMonth, currentYear) as any[];

    let budgetScore = 80;
    let overBudgetCnt = 0;
    if (budgets.length > 0) {
      let totalLimit = 0;
      let totalSpent = 0;
      for (const b of budgets) {
        totalLimit += Number(b.limit_amount);
        totalSpent += Number(b.spent);
        if (Number(b.spent) > Number(b.limit_amount)) overBudgetCnt++;
      }
      if (totalLimit > 0) {
        const ratio = totalSpent / totalLimit;
        budgetScore = Math.max(0, Math.min(100, Math.round((1 - Math.max(0, ratio - 1)) * 100) - overBudgetCnt * 15));
      }
    }

    // Emergency fund coverage
    const monthlyBurn = monthlyExpenses > 0 ? monthlyExpenses : 25000;
    const emergencyMonths = monthlyBurn > 0 ? liquidBalance / monthlyBurn : 0;
    const emergencyFundScore = Math.min(100, Math.round((emergencyMonths / 6) * 100));

    // Debt score
    const totalAssets = liquidBalance + investmentBalance;
    const debtRatio = totalAssets > 0 ? (debtBalance / totalAssets) * 100 : debtBalance > 0 ? 100 : 0;
    const debtScore = Math.max(0, 100 - Math.round(debtRatio * 2));

    // Overall composite score
    const overallScore = Math.round(
      savingsRateScore * 0.35 +
      budgetScore * 0.25 +
      emergencyFundScore * 0.25 +
      debtScore * 0.15
    );

    let tier: 'critical' | 'needs_improvement' | 'good' | 'excellent' = 'good';
    if (overallScore < 40) tier = 'critical';
    else if (overallScore < 65) tier = 'needs_improvement';
    else if (overallScore >= 85) tier = 'excellent';

    res.json({
      overallScore,
      tier,
      components: {
        savingsRate: { score: savingsRateScore, actual: Math.round(savingsRate), target: 30, unit: '%' },
        budgetAdherence: { score: budgetScore, actual: budgets.length > 0 ? overBudgetCnt : 0, target: 0, unit: 'over-budget' },
        emergencyFund: { score: emergencyFundScore, actual: Math.round(emergencyMonths * 10) / 10, target: 6, unit: 'months' },
        debtToAsset: { score: debtScore, actual: Math.round(debtRatio), target: 20, unit: '%' },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
