// src/controllers/ui/widgetLibraryWrapper.ts

import {PluginIdLibraryMap} from "../../constants";

export function getWidget(name: string, props: any) {
    const tempList = name.split('::');
    const widgetName = tempList[1];
    const pluginId = tempList[0];
    const libraryName = PluginIdLibraryMap[pluginId];
    const library: any = window[libraryName]
    const getWidgetFunc = library['getWidget'];
    return getWidgetFunc(widgetName, props);
}

export function getWidgetConfiguration(name: string) {
    const tempList = name.split('::');
    const widgetName = tempList[1];
    const pluginId = tempList[0];
    const libraryName = PluginIdLibraryMap[pluginId];
    const library: any = window[libraryName]
    const getWidgetConfigurationFunc = library['getWidgetConfiguration'];
    return getWidgetConfigurationFunc(widgetName);
}

export function getWidgetInfo(pluginId: string) {
    const libraryName = PluginIdLibraryMap[pluginId];
    const library: any = window[libraryName]
    return library['widgetInfo'];
}
