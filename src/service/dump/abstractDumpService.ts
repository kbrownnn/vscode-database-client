import { Node } from "../../model/interface/node";
import * as vscode from "vscode";

export abstract class AbstractDumpService {

    public dump(node: Node) {
        vscode.window.showOpenDialog({ canSelectMany: false, openLabel: "Select export file path", canSelectFiles: false, canSelectFolders: true }).then((folderPath) => {
            if (folderPath) {
                this.dumpData(node, folderPath[0].fsPath)
            }
        });
    }

    protected abstract dumpData(node: Node, exportPath: string): void;

}