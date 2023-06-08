const fs = require('fs');

module.exports = {
    istanbulReporter: ['html', 'lcov', 'text', 'json', 'json-summary'],
    skipFiles: ['mocks/'],
    onIstanbulComplete: () => {
        const json = require('./coverage/coverage-summary.json');

        const { total, ...contracts } = json;

        const formatCoverage = (coverage) => `${coverage?.covered}/${coverage?.total} (${coverage?.pct}%)`;

        let coverageTable = `|Contract|Statements|Branches|Functions|Lines|\n`;
        coverageTable += `|-|-|-|-|-|\n`;

        for (const [contract, coverage] of Object.entries(contracts)) {
            coverageTable += `|${contract}|${formatCoverage(coverage.statements)}|${formatCoverage(coverage.branches)}|${formatCoverage(coverage.functions)}|${formatCoverage(coverage.lines)}|\n`;
        }

        coverageTable += `|**Total**|**${formatCoverage(total.statements)}**|**${formatCoverage(total.branches)}**|**${formatCoverage(total.functions)}**|**${formatCoverage(total.lines)}**|\n`;

        const markdown = `# Coverage\n\n${coverageTable}`;

        fs.writeFileSync('COVERAGE.md', markdown);
    }
};
