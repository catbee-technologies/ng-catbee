import fs from 'fs';
import istanbulLibCoverage from 'istanbul-lib-coverage';
import { createContext } from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import coverageJson from '../coverage/coverage-merged.json' with { type: 'json' };

const coverageMap = istanbulLibCoverage.createCoverageMap(coverageJson);
const outputDir = './coverage';

fs.mkdirSync(outputDir, { recursive: true });

const context = createContext({ dir: outputDir, coverageMap });

const envReportTypes = process.env.COVERAGE_REPORT_TYPES ? process.env.COVERAGE_REPORT_TYPES.split(',') : null;

/** @type {import('karma').ReporterType[]} */
export const defaultReportTypes = [
  'html',
  'lcovonly',
  'cobertura',
  'text',
  'text-summary',
];

const reportTypes = Array.isArray(envReportTypes) && envReportTypes.length > 0 ? envReportTypes : defaultReportTypes;

console.log('Generating Overall Coverage report...', reportTypes);

for (const reportType of reportTypes) {
  const report = reports.create(reportType, {});
  report.execute(context);
}

console.log('✔ Overall Coverage report generated successfully!');
