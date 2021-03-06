// src/controllers/model/modelManager.ts

import {FSHelper} from "../utils/fsHelper";
import * as _ from 'lodash';
import {getInitialEditorData} from '@flintdev/model-editor-canvas';

interface Config {
    models: Array<object>
}

const INITIAL_CONFIG: Config = {
    models: [],
};

export class ModelManager {
    rootDir: string;
    fsHelper: FSHelper;
    dirPath: string;
    configPath: string;
    sourceDirPath: string;
    constructor(rootDir: string) {
        this.rootDir = rootDir;
        this.fsHelper = new FSHelper();
        this.dirPath = `${this.rootDir}/.flint/models`;
        this.configPath = `${this.rootDir}/.flint/models/config.json`;
        this.sourceDirPath = `${this.rootDir}/src/models`;
    }

    checkAndCreateModelDir = async () => {
        // should be called at models UI loaded
        try {
            await this.fsHelper.checkPathExists(this.dirPath);
        } catch (e) {
            await this.fsHelper.createDirByPath(this.dirPath);
        }
    };

    checkAndCreateSourceDir = async () => {
        try {
            await this.fsHelper.checkPathExists(this.sourceDirPath);
        } catch (e) {
            await this.fsHelper.createDirByPath(this.sourceDirPath);
        }
    };

    createModel = async (modelName: string) => {
        const result = await this.checkAndCreateModelConfigFile();
        if (!result) return false;
        let configJson = await this.fetchConfigData();
        configJson.models.push(modelName);
        await this.saveConfigData(configJson);
    };

    deleteModel = async (modelName: string) => {
        let configJson = await this.fetchConfigData();
        let {models, editorDataMap} = configJson;
        // remove from models
        _.remove(models, (model: string) => model === modelName);
        // remove from editorDataMap
        editorDataMap = _.omit(editorDataMap, [modelName]);
        _.set(configJson, ['editorDataMap'], editorDataMap);
        _.set(configJson, ['models'], models);
        await this.saveConfigData(configJson);
    };

    getModelList = async (): Promise<string[]> => {
        const modelList: string[] = [];
        const configJson = await this.fetchConfigData();
        if (!configJson.models) return modelList;
        return configJson.models;
    };

    getEditorData = async (modelName: string) => {
        const configJson = await this.fetchConfigData();
        return _.get(configJson, ['editorDataMap', modelName]);
    };

    saveEditorData = async (modelName: string, editorData: any) => {
        let configJson = await this.fetchConfigData();
        _.set(configJson, ['editorDataMap', modelName], editorData);
        await this.saveConfigData(configJson);
    };

    getInitialEditorData = (name: string) => {
        const canvasData = getInitialEditorData(name);
        const blockData: any = [{name, items:[]}];
        return {canvasData, blockData};
    };

    private checkAndCreateModelConfigFile = async () => {
        try {
            await this.fsHelper.checkPathExists(this.configPath);
            return true;
        } catch (err) {
            await this.fsHelper.createFile(this.configPath, JSON.stringify(INITIAL_CONFIG));
            return true;
        }
    };

    private fetchConfigData = async () => {
        const data = await this.fsHelper.readFile(this.configPath);
        return JSON.parse(<string>data);
    };

    private saveConfigData = async (configJson: object) => {
        await this.fsHelper.createFile(this.configPath, JSON.stringify(configJson));
        return true
    };
}