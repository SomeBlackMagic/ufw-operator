export default interface BaseK8SController {
    init(): Promise<any>;
    run(): Promise<any>
}