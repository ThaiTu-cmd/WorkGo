import { http } from '../client';
import { orderApi } from '../orderApi';

jest.mock('../client', () => ({ http: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('digital delivery uploads a DELIVERY file and references the returned file ID', async () => {
  const form = new FormData();
  form.append('file', 'demo-pdf');
  const append = jest.spyOn(form, 'append');
  await orderApi.uploadFile('o1', 'DELIVERY', form);
  await orderApi.submitDelivery('o1', { files: [{ fileId: 'file1' }], message: 'Ready for review' });
  expect(http.post).toHaveBeenNthCalledWith(1, '/order/orders/o1/files', form, { timeoutMs: 120000 });
  expect(append).toHaveBeenCalledWith('context', 'DELIVERY');
  expect(http.post).toHaveBeenNthCalledWith(2, '/order/orders/digital/o1/submissions',
    { files: [{ fileId: 'file1' }], message: 'Ready for review' });
});

test('reads delivery versions and obtains the signed file path through the order owner API', async () => {
  await orderApi.getDeliveries('o1');
  await orderApi.getDownloadUrl('o1', 'file1');
  expect(http.get).toHaveBeenNthCalledWith(1, '/order/orders/digital/o1/submissions');
  expect(http.get).toHaveBeenNthCalledWith(2, '/order/orders/o1/files/file1/download-url');
});

test('digital requirements, acceptance and revisions use the server payloads', async () => {
  const values = { description: 'Logo', references: ['https://example.com/reference'] };
  await orderApi.submitRequirements('o1', values);
  await orderApi.acceptDelivery('o1');
  await orderApi.requestRevision('o1', 'Adjust the agreed colors');
  await orderApi.getRevisions('o1');
  expect(http.post).toHaveBeenNthCalledWith(1, '/order/orders/digital/o1/requirements', { values });
  expect(http.post).toHaveBeenNthCalledWith(2, '/order/orders/digital/o1/accept');
  expect(http.post).toHaveBeenNthCalledWith(3, '/order/orders/digital/o1/revisions', { reason: 'Adjust the agreed colors' });
  expect(http.get).toHaveBeenCalledWith('/order/orders/digital/o1/revisions');
});
