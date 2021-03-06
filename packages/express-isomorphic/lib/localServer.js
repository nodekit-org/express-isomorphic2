"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const nodemon_1 = __importDefault(require("nodemon"));
const path_1 = __importDefault(require("path"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const webpack_hot_middleware_1 = __importDefault(require("webpack-hot-middleware"));
const createExpress_1 = __importDefault(require("./createExpress"));
const log_1 = require("./utils/log");
const serverUtils_1 = require("./utils/serverUtils");
const defaultWebpackStats = {
    all: false,
    assets: true,
    builtAt: true,
    chunks: true,
    color: true,
    entrypoints: true,
    errors: true,
};
const localServer = function ({ extend, makeHtmlPath, webpackConfig, webpackStats = defaultWebpackStats, }) {
    const { devMiddleware, hotMiddleware } = createWebpackMiddlewares({
        webpackConfig,
        webpackStats,
    });
    return createExpress_1.default({
        bootstrap: (app, serverState) => {
            setupNodemon(makeHtmlPath);
            app.use([
                devMiddleware,
                hotMiddleware,
                setLaunchStatus(serverState, webpackStats),
            ]);
        },
        extend,
        htmlGenerator: ({ requestUrl, serverState, }) => __awaiter(this, void 0, void 0, function* () {
            const { data } = yield axios_1.default.post('http://localhost:10021/makeHtml', {
                assets: serverState.assets,
                requestUrl,
            });
            return data;
        }),
    });
};
exports.default = localServer;
function createWebpackMiddlewares({ webpackConfig, webpackStats, }) {
    log_1.log('createWebpackMiddlewares(): webpack-client-local will be compiled with config:\n%j', webpackConfig);
    const clientWebpackCompiler = webpack_1.default(webpackConfig);
    const devMiddleware = webpack_dev_middleware_1.default(clientWebpackCompiler, {
        publicPath: webpackConfig.output.publicPath,
        serverSideRender: true,
        stats: webpackStats,
    });
    const hotMiddleware = webpack_hot_middleware_1.default(clientWebpackCompiler, {
        heartbeat: 2000,
        reload: true,
    });
    return { devMiddleware, hotMiddleware };
}
const setLaunchStatus = (serverState, webpackStats) => (req, res, next) => {
    if (serverState.buildHash !== res.locals.webpackStats.hash) {
        const webpackBuild = res.locals.webpackStats.toJson(webpackStats);
        const { error, assets } = serverUtils_1.parseWebpackBuild(webpackBuild);
        serverState.update(Object.assign({ assets, buildHash: res.locals.webpackStats.hash }, error && {
            error: {
                errorObj: error,
                type: 'LOCAL_WEBPACK_BUILD_ERROR',
            },
        }, { isLaunched: true }));
    }
    next();
};
function setupNodemon(makeHtmlPath) {
    log_1.log('setupNodemon(): parent pid: %s, makeHtmlPath: %s', process.pid, makeHtmlPath);
    const script = path_1.default.resolve(__dirname, 'htmlGeneratingServer.js');
    nodemon_1.default({
        args: [
            '--port',
            10021,
            '--makeHtmlPath',
            makeHtmlPath,
        ],
        ext: 'js json jsx ts tsx',
        script,
    })
        .on('quit', () => {
        log_1.log('setupNodemon(): quit');
        process.exit();
    })
        .on('restart', (files) => {
        log_1.log(`setupNodemon(): ${chalk_1.default.green('restarted')} by: %s`, files);
    });
}
