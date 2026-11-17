import * as React from 'react';
import { act, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { createCommunicationRealtime } from '@/api/communicationRealtime';
import { CommunicationProvider, useConversationEvents } from '../CommunicationProvider';

let mockToken = 'token-a';
let mockOnline = true;
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ token: mockToken, claims: { userId: mockToken === 'token-b' ? 'u2' : 'u1' } }) }));
jest.mock('@react-native-community/netinfo', () => ({ useNetInfo: () => ({ isConnected: mockOnline }) }));
jest.mock('@/api/communicationRealtime', () => ({ createCommunicationRealtime: jest.fn() }));
const ids = ['c1'];
function Watcher() { useConversationEvents(ids); return null; }
function setup() {
  const queries = new QueryClient();
  const ui = () => <QueryClientProvider client={queries}><CommunicationProvider><Watcher /></CommunicationProvider></QueryClientProvider>;
  return { queries, ui };
}
let change: (state: string) => void;
let connections: { start: jest.Mock; stop: jest.Mock; watch: jest.Mock }[];
beforeEach(() => {
  mockToken = 'token-a'; mockOnline = true; connections = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    change = handler as (state: string) => void;
    return { remove: jest.fn() };
  });
  (createCommunicationRealtime as jest.Mock).mockImplementation(() => {
    const live = { start: jest.fn(), stop: jest.fn(), watch: jest.fn(() => jest.fn()) };
    connections.push(live); return live;
  });
});

test('switching accounts stops the old connection and uses the new credentials', async () => {
  const { queries, ui } = setup(); const view = await render(ui());
  expect(connections[0].start).toHaveBeenCalledTimes(1);
  expect(connections[0].watch).toHaveBeenCalledWith(['c1']);
  mockToken = 'token-b'; await view.rerender(ui());
  expect(connections[0].stop).toHaveBeenCalledTimes(1);
  expect(createCommunicationRealtime).toHaveBeenLastCalledWith(queries, 'u2', 'token-b');
  expect(connections[1].start).toHaveBeenCalledTimes(1);
});
test('background and offline state suspend the connection; returning online reconnects', async () => {
  const { ui } = setup(); const view = await render(ui());
  await act(async () => { change('background'); });
  expect(connections[0].stop).toHaveBeenCalledTimes(1);
  await act(async () => { change('active'); });
  expect(connections[1].start).toHaveBeenCalledTimes(1);
  mockOnline = false; await view.rerender(ui());
  expect(connections[1].stop).toHaveBeenCalledTimes(1);
  mockOnline = true; await view.rerender(ui());
  expect(connections[2].start).toHaveBeenCalledTimes(1);
});
test('logout and unmount close the transport and release screen subscriptions', async () => {
  const { ui } = setup(); const view = await render(ui());
  const release = connections[0].watch.mock.results[0].value;
  mockToken = ''; await view.rerender(ui());
  expect(connections[0].stop).toHaveBeenCalledTimes(1);
  expect(release).toHaveBeenCalledTimes(1);
  await view.unmount();
  expect(connections).toHaveLength(1);
});
