import { filtersFromParams } from '../exploreParams';

test('reads categoryId and a valid executionType', () => {
  expect(filtersFromParams({ categoryId: 'c1', executionType: 'ONSITE' })).toEqual({ categoryId: 'c1', executionType: 'ONSITE' });
  expect(filtersFromParams({ executionType: 'DIGITAL' })).toEqual({ executionType: 'DIGITAL' });
});

test('ignores an unknown executionType and empty params', () => {
  expect(filtersFromParams({ executionType: 'TELEPORT' })).toEqual({});
  expect(filtersFromParams({})).toEqual({});
});
