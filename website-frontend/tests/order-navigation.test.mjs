import test from 'node:test';
import assert from 'node:assert/strict';
import { selectOrderId } from '../src/_webapp-mirror/utils/orderNavigation.js';
test('Back to the order list clears the previous targeted order', () => {
  let selected = selectOrderId('orders', { orderId: 'o99' }, '');
  assert.equal(selected, 'o99');
  selected = selectOrderId('orders', {}, selected);
  assert.equal(selected, '');
});
test('unrelated navigation preserves selection and an explicit server ID replaces it', () => {
  assert.equal(selectOrderId('catalog', {}, 'o99'), 'o99');
  assert.equal(selectOrderId('order-payment', {}, 'o99'), '');
  assert.equal(selectOrderId('orders', { orderId: 'o2' }, 'o99'), 'o2');
});
