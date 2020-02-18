// src/redux/modules/editor/processEditor/reducer.ts

import * as types from './types';
import update from 'immutability-helper';
import {ProcessEditorAction} from "./actions";

export function reducer(state: object, action: ProcessEditorAction) {
    switch (action.type) {
        case types.SET_PROCESS_LIST:
            return update(state, {
                processList: {$set: action.processList}
            });
        case types.SELECT_PROCESS:
            return update(state, {
                processSelected: {$set: action.value}
            });
        case types.PROCESS_EDITOR_DIALOG_OPEN:
            return update(state, {
                processEditorDialog: {
                    open: {$set: true}
                }
            });
        case types.PROCESS_EDITOR_DIALOG_CLOSE:
            return update(state, {
                processEditorDialog: {
                    open: {$set: false}
                }
            });

        default:
            return state;
    }
}

export {ProcessEditorAction};