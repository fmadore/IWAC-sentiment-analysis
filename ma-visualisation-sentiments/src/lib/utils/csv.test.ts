import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCSVFile, escapeCSVField, toCSV } from './csv';

describe('escapeCSVField', () => {
	it('quotes separators, quotes and line breaks', () => {
		expect(escapeCSVField('a,b')).toBe('"a,b"');
		expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""');
		expect(escapeCSVField('line\nbreak')).toBe('"line\nbreak"');
		expect(escapeCSVField(null)).toBe('');
		expect(escapeCSVField(undefined)).toBe('');
	});

	it('neutralises text a spreadsheet would evaluate as a formula', () => {
		expect(escapeCSVField('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
		expect(escapeCSVField('- une liste')).toBe("'- une liste");
		expect(escapeCSVField('+33 prose')).toBe("'+33 prose");
		expect(escapeCSVField('@cmd')).toBe("'@cmd");
	});

	it('leaves numbers, including negative ones, machine-readable', () => {
		expect(escapeCSVField(-0.35)).toBe('-0.35');
		expect(escapeCSVField('-12')).toBe('-12');
		expect(escapeCSVField('+1.5e-3')).toBe('+1.5e-3');
		expect(escapeCSVField(0)).toBe('0');
	});

	it('exports dates exactly as stored, never with invented precision', () => {
		// Month-only and ranged dates are real in the corpus; "1995-03" must not
		// become "1995-03-01".
		expect(escapeCSVField('1995-03')).toBe('1995-03');
		expect(escapeCSVField('1993-02/1993')).toBe('1993-02/1993');
	});
});

describe('toCSV', () => {
	it('escapes every cell of the header and data rows', () => {
		expect(
			toCSV(
				['Title', 'Score'],
				[
					["Côte d'Ivoire, Abidjan", -1],
					[null, 2]
				]
			)
		).toBe('Title,Score\n"Côte d\'Ivoire, Abidjan",-1\n,2');
	});
});

describe('downloadCSVFile', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('prefixes a UTF-8 byte-order mark and revokes the URL only later', async () => {
		vi.useFakeTimers();
		let blob: Blob | undefined;
		const create = vi.fn((value: Blob) => {
			blob = value;
			return 'blob:csv';
		});
		const revoke = vi.fn();
		vi.stubGlobal('URL', { ...URL, createObjectURL: create, revokeObjectURL: revoke });
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

		downloadCSVFile('a,b', 'export.csv');

		expect(revoke).not.toHaveBeenCalled();
		vi.runAllTimers();
		expect(revoke).toHaveBeenCalledWith('blob:csv');
		const bytes = new Uint8Array(await blob!.arrayBuffer());
		expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
		vi.unstubAllGlobals();
	});
});
