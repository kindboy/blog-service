import * as Router from 'koa-router';

import { mapRoute, RouteItem, Routes } from '../decorators/router-decorator';
import Test from './test';
import Article from './article';

const router = new Router({
    prefix: '/api'
});

class Controller {
    router: Router = router

    routes: Array<any> = [Test, Article]

    constructor() {
        this.init();
    }

    init() {
        this.routes.forEach((routes: Routes) => {
            this.createAction(mapRoute(routes));
        });
    }

    createAction(actions: Routes) {
        const { prefix = '', RoutesList = [] } = actions;
        RoutesList.forEach((item: RouteItem) => {
            this.router[item.method](`${prefix}${item.route}`, item.fn);
        });
    }
}

export default new Controller().router;