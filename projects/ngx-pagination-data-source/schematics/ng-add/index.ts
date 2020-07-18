import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics'
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'
import {addPackageToPackageJson} from '@angular/cdk/schematics/ng-add/package-config'

// Just return the tree
export function ngAdd(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    addPackageToPackageJson(tree, 'ngx-pagination-data-source', '2.0.0')
    context.addTask(new NodePackageInstallTask())
    return tree
  }
}
