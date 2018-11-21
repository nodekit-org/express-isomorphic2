import { MakeHtml, Server, WebpackStats } from './createExpress';
declare const ExpressIsomorphic: ExpressIsomorphicType;
export default ExpressIsomorphic;
export { attachAssets } from './utils/serverUtils';
interface ExpressIsomorphicType {
    create: Create;
}
interface Create {
    (arg: {
        bundlePath: string;
        makeHtml: MakeHtml;
        publicPath: string;
        serverDistPath: string;
        universalAppPath: string;
        webpackConfigClientLocalPath: string;
        webpackConfigUniversalLocalPath: string;
        webpackStats?: WebpackStats;
    }): {
        localServer: () => Server;
        productionServer: () => Server;
    };
}
//# sourceMappingURL=index.d.ts.map