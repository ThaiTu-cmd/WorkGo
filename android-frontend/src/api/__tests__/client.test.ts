import { configureClient, http } from '../client';
import { ApiError, UNREACHABLE_MESSAGE } from '../errors';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('no body');
      return body;
    },
  });
}

let token: string | null;
const onUnauthorized = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  onUnauthorized.mockReset();
  token = null;
  configureClient({ getToken: () => token, onUnauthorized });
});

async function caught(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (e) {
    return e as ApiError;
  }
  throw new Error('expected rejection');
}

test('sends bearer token and JSON body to API_BASE_URL + path with params', async () => {
  token = 't1';
  respond(200, { result: { ok: true } });
  const body = await http.post('/catalog/services', { title: 'x' });

  expect(body).toEqual({ result: { ok: true } });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('http://10.0.2.2:8888/api/v1/catalog/services');
  expect(init.method).toBe('POST');
  expect(init.headers.Authorization).toBe('Bearer t1');
  expect(init.headers['Content-Type']).toBe('application/json');
  expect(init.body).toBe(JSON.stringify({ title: 'x' }));
});

test('builds the query string from params', async () => {
  respond(200, {});
  await http.get('/catalog/services', { params: { page: 0, size: 50 } });
  expect(fetchMock.mock.calls[0][0]).toBe('http://10.0.2.2:8888/api/v1/catalog/services?page=0&size=50');
});

test('omits undefined params and the Authorization header without a token', async () => {
  respond(200, {});
  await http.get('/x', { params: { a: 1, b: undefined } });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('http://10.0.2.2:8888/api/v1/x?a=1');
  expect(init.headers.Authorization).toBeUndefined();
});

test('401 with code 1007 → status 403, onUnauthorized not called', async () => {
  token = 't1';
  respond(401, { code: 1007, message: 'You do not have that permission' });
  const err = await caught(http.get('/catalog/services/my-services'));
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(403);
  expect(err.code).toBe(1007);
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('401 with token → onUnauthorized called once, ApiError status 401', async () => {
  token = 't1';
  respond(401, { code: 1006, message: 'Unauthenticated' });
  const err = await caught(http.get('/order/orders'));
  expect(err.status).toBe(401);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test('401 without token → onUnauthorized not called', async () => {
  respond(401, { code: 1006, message: 'Unauthenticated' });
  const err = await caught(http.get('/order/orders'));
  expect(err.status).toBe(401);
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('network failure → ApiError status 0 with UNREACHABLE_MESSAGE', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
  const err = await caught(http.get('/x'));
  expect(err.status).toBe(0);
  expect(err.message).toBe(UNREACHABLE_MESSAGE);
});

test('502 without JSON body → UNREACHABLE_MESSAGE', async () => {
  respond(502, undefined);
  const err = await caught(http.get('/x'));
  expect(err.status).toBe(502);
  expect(err.message).toBe(UNREACHABLE_MESSAGE);
});

test('400 with body { code: 2022, message } → ApiError code 2022', async () => {
  respond(400, { code: 2022, message: 'Phase required' });
  const err = await caught(http.post('/order/orders/1/evidence', {}));
  expect(err.status).toBe(400);
  expect(err.code).toBe(2022);
  expect(err.message).toBe('Phase required');
});

test('2xx without a body resolves to null', async () => {
  respond(200, undefined);
  await expect(http.delete('/identity/addresses/1')).resolves.toBeNull();
});
