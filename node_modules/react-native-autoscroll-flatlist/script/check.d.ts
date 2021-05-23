export declare class CodeChecker {
    private readonly projectPath;
    constructor({ projectPath }: {
        projectPath: string;
    });
    run(): void;
    private checkCodeStyle;
    private checkTypeScript;
    private checkLint;
}
