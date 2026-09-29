import {describe,it,expect} from 'vitest';
import {formatMoney} from './money.js';
describe('formatMoney',()=>it('formats paise as INR',()=>expect(formatMoney(12345)).toContain('123.45')));
