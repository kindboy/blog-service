import * as Koa from 'koa';
import { getMongoRepository, MongoRepository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { resReturn, log, md5Decode } from '../utils/index';
import AuthUtil from '../utils/auth';
import AuthEntity from '../entity/auth';
import models from '../models';
import AuthModel from '../models/auth';
import {
    Controller, Get, Post, Put, Patch
} from '../decorators/router-decorator';
import { config } from '../config';

@Controller({ prefix: '' })
export default class Auth {
    model: AuthModel = models.getInstance<AuthModel>(AuthModel);

    // 初始化管理员账户中间件
    static async initAdmin(ctx: Koa.Context, next: () => Promise<any>) {
        const username = config.defaultUsername;
        const password = md5Decode(config.defaultPassword);
        const authRepo: MongoRepository<AuthEntity> = getMongoRepository(AuthEntity);
        const authInst: AuthModel = models.getInstance<AuthModel>(AuthModel);
        try {
            const res = await authInst.count();
            if (!res) {
                const user = authRepo.create({
                    username,
                    password
                });
                await authInst.save(user);
                log('初始化admin管理员账户成功');
            }
        } catch (error) {
            log('初始化admin管理员账户出错', 'error');
        }
        await next();
    }

    /**
     * 登陆
     * @param username 用户名
     * @param password 密码
     */
    @Post('/login')
    async login(ctx: Koa.Context) {
        const { username, password } = ctx.request.body;

        try {
            const auth: AuthEntity = await this.model.findByUsername(username);
            if (!auth) {
                ctx.body = resReturn(null, 400, '用户名不存在');
                return;
            }
            if (auth.password === md5Decode(password)) {
                const token = jwt.sign({
                    username: auth.username,
                    password: auth.password,
                    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
                }, config.jwtSecret);
                ctx.body = resReturn({
                    username: auth.username,
                    name: auth.name,
                    gravatar: auth.gravatar,
                    slogan: auth.slogan,
                    token,
                    activeTime: Math.floor(Date.now() / 1000 + (60 * 60 * 24 * 7))
                });
            } else {
                ctx.body = resReturn(null, 401, '密码错误');
            }
        } catch (error) {
            log(error, 'error');
            ctx.body = resReturn(null, 500, '服务器内部错误');
        }
    }

    /**
     * 修改用户信息
     * @body username 用户名
     * @body name 名字
     * @body slogan 签名
     * @body gravatar 头像链接
     */
    @Put('/auth')
    async updateAdmin(ctx: Koa.Context) {
        const {
            username, name, slogan, gravatar
        } = ctx.request.body;
        const authRepo: MongoRepository<AuthEntity> = getMongoRepository(AuthEntity);

        try {
            const user = await this.model.findByUsername(username);
            if (!user) {
                ctx.body = resReturn(null, 400, '用户名不存在');
                return;
            }
            const updateUser = authRepo.merge(user, {
                username,
                name,
                slogan,
                gravatar
            });
            await this.model.save(updateUser);
            ctx.body = resReturn({
                username: updateUser.username,
                name: updateUser.name,
                gravatar: updateUser.gravatar,
                slogan: updateUser.slogan
            });
        } catch (error) {
            log(error, 'error');
            ctx.body = resReturn(null, 500, '服务器内部错误');
        }
    }

    /**
     * 修改密码
     * @body oldPass 旧密码
     * @body newPass 新密码
     */
    @Patch('/auth')
    async updatePassword(ctx: Koa.Context) {
        const { oldPass, newPass } = ctx.request.body;
        const { username } = <any>AuthUtil.getVerifiedInfo(ctx.request);
        const authRepo: MongoRepository<AuthEntity> = getMongoRepository(AuthEntity);
        try {
            const user = await this.model.findByUsername(username);
            if (!user) {
                ctx.body = resReturn(null, 400, '用户名不存在');
                return;
            }
            if (user.password !== md5Decode(oldPass)) {
                ctx.body = resReturn(null, 401, '原密码错误');
                return;
            }
            if (newPass === oldPass || newPass.trim() === '') {
                ctx.body = resReturn(null, 400, '新密码不可和旧密码一样或为空');
                return;
            }
            const updateUser = authRepo.merge(user, {
                password: md5Decode(newPass)
            });
            await this.model.save(updateUser);
            const token = jwt.sign({
                username: updateUser.username,
                password: updateUser.password,
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
            }, config.jwtSecret);
            ctx.body = resReturn({
                username: updateUser.username,
                name: updateUser.name,
                gravatar: updateUser.gravatar,
                slogan: updateUser.slogan,
                token,
                activeTime: Math.floor(Date.now() / 1000 + (60 * 60 * 24 * 7))
            });
        } catch (error) {
            log(error, 'error');
            ctx.body = resReturn(null, 500, '服务器内部错误');
        }
    }
}
