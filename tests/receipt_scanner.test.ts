import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { receiptService } from '../server/services/receiptService.ts';

describe('Receipt Scanner Service Suite', () => {
  it('Gracefully scans receipt image data and returns structured output and receiptUrl', async () => {
    // 1x1 transparent png in base64
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    const result = await receiptService.scanReceipt(sampleBase64, 'image/png', 'swiggy_dinner_bill.png');

    assert.ok(result, 'Result should exist');
    assert.ok(result.receiptUrl, 'Should return a receiptUrl');
    assert.ok(result.data, 'Should return extracted data');
    assert.equal(result.data.currency, 'INR');
    assert.ok(result.data.date, 'Should have a valid date');
    assert.equal(result.data.category, 'food', 'Should classify swiggy as food');
  });

  it('Infers shopping category for retail bills', async () => {
    const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const result = await receiptService.scanReceipt(sampleBase64, 'image/jpeg', 'amazon_shopping_invoice.jpg');

    assert.ok(result);
    assert.equal(result.data.category, 'shopping');
  });

  it('Infers broadband category for telecom bills', async () => {
    const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const result = await receiptService.scanReceipt(sampleBase64, 'image/jpeg', 'airtel_broadband_bill.jpg');

    assert.ok(result);
    assert.equal(result.data.category, 'broadband');
  });
});
