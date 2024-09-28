import Router from "koa-router";

export default abstract class BaseApiController {
    abstract registerRoutes(): Router
}
export interface ApiControllerInterface {

}