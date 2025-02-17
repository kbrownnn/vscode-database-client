import { ModelType } from "@/common/constants";
import { CatalogNode } from "@/model/database/catalogNode";
import { ConnectionNode } from "@/model/database/connectionNode";
import { SchemaNode } from "@/model/database/schemaNode";
import { UserGroup } from "@/model/database/userGroup";
import { Node } from "@/model/interface/node";
import { FunctionGroup } from "@/model/main/functionGroup";
import { ProcedureGroup } from "@/model/main/procedureGroup";
import { TableGroup } from "@/model/main/tableGroup";
import { TriggerGroup } from "@/model/main/triggerGroup";
import { ViewGroup } from "@/model/main/viewGroup";
import { ConnectionManager } from "@/service/connectionManager";

export class NodeFinder {

    public static async findNodes(schema: string, table: string, ...types: ModelType[]): Promise<Node[]> {

        let lcp = ConnectionManager.tryGetConnection();
        if (!lcp) return [];

        if (schema) {
            const connectcionid = lcp?.getConnectId({ schema: schema, withSchema: true });
            lcp = Node.nodeCache[connectcionid]
            if (!lcp) return []
        } else {
            let isSchema = lcp instanceof SchemaNode || lcp instanceof CatalogNode;
            while (lcp != null && !isSchema) {
                lcp = lcp.parent
                isSchema = lcp instanceof SchemaNode || lcp instanceof CatalogNode;
            }
        }

        let nodeList = []
        const groupNodes = await lcp.getChildren();
        for (const type of types) {
            switch (type) {
                case ModelType.COLUMN:
                    nodeList.push(...(await lcp.getByRegion(table)?.getChildren()))
                    break;
                case ModelType.SCHEMA:
                    if (!lcp || !lcp?.parent?.getChildren) { break; }
                    const databaseNodes = await lcp.parent.getChildren()
                    nodeList.push(...databaseNodes.filter(databaseNodes => !(databaseNodes instanceof UserGroup)))
                    break;
                case ModelType.TABLE:
                    if (lcp instanceof ConnectionNode) break;
                    nodeList.push(...await groupNodes.find(n => n instanceof TableGroup).getChildren())
                    break;
                case ModelType.VIEW:
                    if (lcp instanceof ConnectionNode) break;
                    nodeList.push(...await groupNodes.find(n => n instanceof ViewGroup).getChildren())
                    break;
                case ModelType.PROCEDURE:
                    if (lcp instanceof ConnectionNode) break;
                    nodeList.push(...await groupNodes.find(n => n instanceof ProcedureGroup).getChildren())
                    break;
                case ModelType.TRIGGER:
                    if (lcp instanceof ConnectionNode) break;
                    nodeList.push(...await groupNodes.find(n => n instanceof TriggerGroup).getChildren())
                    break;
                case ModelType.FUNCTION:
                    if (lcp instanceof ConnectionNode) break;
                    nodeList.push(...await groupNodes.find(n => n instanceof FunctionGroup).getChildren())
                    break;
            }
        }
        return nodeList;
    }

}