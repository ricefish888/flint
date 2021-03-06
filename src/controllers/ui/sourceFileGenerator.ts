// src/controllers/ui/sourceFileGenerator.ts
// generate UI/React source files

import {UIDataManager, UIData} from "./uiDataManager";
import {FSHelper} from "../utils/fsHelper";
import BabelRC from './templates/babelrc.txt';
import NpmRC from './templates/npmrc.txt';
import IndexHTML from './templates/index-html.txt';
import PackageJSON from './templates/package-json.txt';
import WebpackConfig from './templates/webpack-config.txt';
import ReduxStoreJS from './templates/redux-store-js.txt';
import ReduxActionsJS from './templates/redux-actions-js.txt';
import ReduxReducerJS from './templates/redux-reducer-js.txt';
import ReduxTypesJS from './templates/redux-types-js.txt';
import IndexJSX from './templates/index-jsx.txt';
import ServerJS from './templates/server-js.txt';
import ReactCode from './templates/react-code.txt'
import ActionsRootIndexJS from './templates/actions-root-index-js.txt';
import ActionIndexJS from './templates/action-index-js.txt';
import * as Mustache from "mustache";
import * as _ from 'lodash';
import {ProjectManager} from "../project/projectManager";
import {StateUpdaterData} from "@flintdev/ui-editor/dist/interface";
import {ReactCodeFormatter} from "./reactCodeFormatter";

interface File {
    path: string,
    content: string,
}

export class SourceFileGenerator {
    uiDataManager: UIDataManager;
    fsHelper: FSHelper;
    editorData: UIData;
    sourceDirPath: string;
    projectName: string;
    projectManager: ProjectManager;
    constructor(rootDir: string) {
        this.uiDataManager = new UIDataManager(rootDir);
        this.projectManager = new ProjectManager(rootDir);
        this.fsHelper = new FSHelper();
        this.sourceDirPath = `${rootDir}/src/ui`;
        this.projectName = this.projectManager.getProjectName();
    }

    loadEditorData = async () => {
        this.editorData = await this.uiDataManager.getUIData();
    };

    checkAndCreateDir = async (dir: string) => {
        try {
            await this.fsHelper.checkPathExists(dir);
        } catch (e) {
            await this.fsHelper.createDirByPath(dir);
        }
    };

    generate = async () => {
        await this.removeSourceDir();
        await this.checkAndCreateDir(this.sourceDirPath);
        await this.loadEditorData();
        await this.generateReduxFiles();
        const packages = await this.generateComponentFiles();
        await this.generateConfigFiles(packages);
        await this.generateActionFiles();
    };

    private removeSourceDir = async () => {
        const excluded = ['node_modules'];
        try {
            const dirs = await this.fsHelper.readDir(this.sourceDirPath);
            for (const dir of dirs) {
                const name = dir.name;
                if (!excluded.includes(name)) await this.fsHelper.removeDir(`${this.sourceDirPath}/${name}`);
            }
        } catch (err) {
            console.log('remove source dir - err', err);
        }
    };

    private generateConfigFiles = async (packages: string[]) => {
        let files: File[] = [];
        const {settings} = this.editorData;
        const dependencies = !!settings.dependencies ? settings.dependencies : [];
        const libraries = !!settings.libraries ? settings.libraries : [];
        // webpack.config.js
        files.push({
            path: `${this.sourceDirPath}/webpack.config.js`,
            content: WebpackConfig
        });
        // package.json
        files.push({
            path: `${this.sourceDirPath}/package.json`,
            content: Mustache.render(PackageJSON, {
                projectName: this.projectName,
                libraries,
                packages: packages.map(item => {return {name: item}})
            }),
        });
        // .babelrc
        files.push({
            path: `${this.sourceDirPath}/.babelrc`,
            content: BabelRC
        });
        // .npmrc
        files.push({
            path: `${this.sourceDirPath}/.npmrc`,
            content: NpmRC
        });
        // index.html
        files.push({
            path: `${this.sourceDirPath}/index.html`,
            content: Mustache.render(IndexHTML, {
                projectName: this.projectName,
                dependencies,
            })
        });
        // index.jsx
        files.push({
            path: `${this.sourceDirPath}/index.jsx`,
            content: IndexJSX
        });
        // server.js
        files.push({
            path: `${this.sourceDirPath}/server.js`,
            content: ServerJS
        });
        await this.batchToCreateFiles(files);
    };

    private generateComponentFiles = async () => {
        let files: File[] = [];
        const {components} = this.editorData;
        const data = new ReactCodeFormatter(components).getRenderData();
        const componentsDir = `${this.sourceDirPath}/components`;
        await this.checkAndCreateDir(componentsDir);
        files.push({
            path: `${componentsDir}/Root.jsx`,
            content: Mustache.render(ReactCode, data),
        });
        await this.batchToCreateFiles(files);
        return data.packages;
    };

    private generateActionFiles = async () => {
        let files: File[] = [];
        const {actions} = this.editorData;
        const actionsDir = `${this.sourceDirPath}/actions`;
        await this.checkAndCreateDir(actionsDir);
        // actions root index.js
        files.push({
            path: `${actionsDir}/index.js`,
            content: Mustache.render(ActionsRootIndexJS, {actions})
        });
        for (const action of actions) {
            // action.js
            const actionDir = `${actionsDir}/${action.name}`;
            await this.checkAndCreateDir(actionDir);
            files.push({
                path: `${actionDir}/action.js`,
                content: action.code,
            });
            // action index.js
            files.push({
                path: `${actionDir}/index.js`,
                content: Mustache.render(ActionIndexJS, {name: action.name})
            });
        }
        await this.batchToCreateFiles(files);
    };

    private generateReduxFiles = async () => {
        let {initialState, stateUpdaters} = this.editorData;
        const reduxDir = `${this.sourceDirPath}/redux`;
        await this.checkAndCreateDir(reduxDir);
        let files: File[] = [];
        const updaters = this.reformatUpdaters(stateUpdaters);
        // redux actions.js
        files.push({
            path: `${reduxDir}/actions.js`,
            content: Mustache.render(ReduxActionsJS, {updaters}),
        });
        // redux reducer.js
        files.push({
            path: `${reduxDir}/reducer.js`,
            content: Mustache.render(ReduxReducerJS, {updaters}),
        });
        // redux types.js
        files.push({
            path: `${reduxDir}/types.js`,
            content: Mustache.render(ReduxTypesJS, {updaters}),
        });
        // redux store.js
        files.push({
            path: `${reduxDir}/store.js`,
            content: ReduxStoreJS,
        });
        // redux state.js
        initialState = !!initialState && initialState !== "" ? initialState : '{}';
        files.push({
            path: `${reduxDir}/state.js`,
            content: `export const initialState = ${initialState}`,
        });
        await this.batchToCreateFiles(files);
    };

    private reformatUpdaters = (stateUpdaters: StateUpdaterData[]) => {
        return stateUpdaters.map((updater: StateUpdaterData) => {
            let data = {};
            updater.operations.forEach(operation => {
                const {field, operator, parameter} = operation;
                const path = field.split('.').slice(1);
                _.set(data, path, {[`$${operator.toLowerCase()}`]: `action.args.${parameter}`})
            });
            let dataStr = JSON.stringify(data, null, 4).replace(/"/gi, '');
            const tempList = dataStr.split('\n');
            dataStr = `${tempList.join(`\n${new Array(12).fill(' ').join('')}`)}`;
            return {
                name: updater.name,
                actionName: _.camelCase(updater.name),
                data: dataStr,
            }
        })
    };

    private batchToCreateFiles = async (files: File[]) => {
        for (const file of files) {
            const {path, content} = file;
            await this.fsHelper.createFile(path, content);
        }
    };
}