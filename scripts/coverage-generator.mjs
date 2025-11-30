import istanbulApi from 'istanbul-api';
import istanbulCoverage from 'istanbul-lib-coverage';
import coverage from '../coverage/coverage-final.json' with { type: 'json' };

const { createReporter } = istanbulApi;
const { createCoverageMap } = istanbulCoverage;

const map = createCoverageMap();
for (const file of Object.keys(coverage)) {
  map.addFileCoverage(coverage[file]);
}

const reporter = createReporter();
reporter.addAll(['html', 'lcovonly', 'text-summary', 'cobertura']);
reporter.write(map);

console.log('✔ Overall Coverage report generated successfully');
