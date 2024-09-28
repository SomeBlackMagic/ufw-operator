import BusConfiguration from "./BusConfiguration";

export class Bus {
    private constructor() {}

    /**
     * Configures the Bus prior to use
     */
    static configure(): BusConfiguration {
        return new BusConfiguration()
    }
}