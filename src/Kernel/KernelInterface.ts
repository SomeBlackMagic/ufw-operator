export interface KernelInterface {
    boot(): Promise<boolean>;
    run(): Promise<any>;
}