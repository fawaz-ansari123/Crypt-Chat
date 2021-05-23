export declare class Utility {
    /**
     * Run a command (support both global binary & node_modules binary) and wait for its execution.
     *
     * Throw Error if any error occurs, or returning non-zero result.
     *
     * Usage:
     *      runProcess("prettier", ["--config", "/path"])
     */
    static runProcess(command: string, args: string[]): void;
    /**
     * Output to console in a clear way, with color (supported by chalk library).
     *
     * Usage:
     *      print("Start downloading")
     *      print("Downloading resources from HTTP", "http://abc.com/end/point")
     */
    static print(descriptiveTitle: string, extraInfo?: string): void;
    /**
     * Print the detailed error information, then exit the current process, with code 1.
     */
    static printErrorThenExit(...error: (Error | string)[]): void;
    /**
     * Execute "prettier" command to prettify the code。
     *
     * If checkOnly is truthy, it will check the source format, and triggers error if bad formatted.
     * Else, it will go through and modify the source (if needed) in correct format.
     */
    static prettier(source: string, checkOnly?: boolean): void;
    /**
     * Formatting target files via Prettier
     *
     * Accept both file path or folder as input
     *
     * Example:
     * ```
     * formatFile('./src')
     * formatFile('./src/index.ts', './api')
     * ```
     */
    static formatFile(...files: string[]): void;
}
