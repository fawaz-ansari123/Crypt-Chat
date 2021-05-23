import path from "path";
import { Utility } from "./Utility";
export class CodeChecker {
    constructor({ projectPath }) {
        this.projectPath = projectPath;
    }
    run() {
        this.checkCodeStyle();
        this.checkLint();
        this.checkTypeScript();
    }
    checkCodeStyle() {
        Utility.print("Checking code styles (both current project and shared)");
        Utility.prettier(`${this.projectPath}/*.{ts,tsx}`, true);
        Utility.prettier(`${this.projectPath}/component/*.{ts,tsx}`, true);
        Utility.prettier(`${this.projectPath}/script/*.{ts,tsx}`, true);
    }
    checkTypeScript() {
        Utility.print("Checking TypeScript");
        Utility.runProcess("tsc", ["-p", this.projectPath, "--noEmit"]);
    }
    checkLint() {
        Utility.print("Checking Lint");
        Utility.runProcess("eslint", [`${this.projectPath}/*.{ts,tsx}`]);
        Utility.runProcess("eslint", [`${this.projectPath}/component/*.{ts,tsx}`]);
        Utility.runProcess("eslint", [`${this.projectPath}/script/*.{ts,tsx}`]);
    }
}
new CodeChecker({ projectPath: path.resolve(__dirname, "../") }).run();
//# sourceMappingURL=check.js.map