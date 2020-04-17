[![npm-badge](https://img.shields.io/npm/v/ngx-pagination-data-source.svg?style=flat-square)](https://www.npmjs.com/package/ngx-pagination-data-source)
&nbsp;
[![travis-badge](https://img.shields.io/travis/nilsmehlhorn/ngx-pagination-data-source/master.svg?style=flat-square)](https://travis-ci.org/nilsmehlhorn/ngx-pagination-data-source)
&nbsp;
[![codecov-badge](https://codecov.io/gh/nilsmehlhorn/ngx-pagination-data-source/branch/master/graph/badge.svg)](https://codecov.io/gh/nilsmehlhorn/ngx-pagination-data-source)

ngx-pagination-data-source provides an easy to use paginated `DataSource` for [Angular Material & CDK](https://material.angular.io/) that works with HTTP or any other way you're fetching pages.

⚡ [Example StackBlitz](https://stackblitz.com/github/nilsmehlhorn/ngx-pagination-data-source-example)

## Installation

```bash
npm i ngx-pagination-data-source
```

## Usage

Have a type you want to display in a [table](https://material.angular.io/components/table/overview) (or any other component accepting a `DataSource`).

```ts
export interface User {
  id: number
  name: string
  email: string
  phone: string
  registrationDate: Date
}
```

Define a query model and a service that can fetch pages based on this model.

```ts
import { PageRequest, Page } from 'ngx-pagination-data-source'

export interface UserQuery {
  search: string
  registration: Date
}

@Injectable({providedIn: 'root'})
export class UserService {
  page(request: PageRequest<User>, query: UserQuery): Observable<Page<User>> {
    // transform request & query into something your server can understand
    // (you might want to refactor this into a utility function)
    const params = {
      pageNumber: request.page, 
      pageSize: request.size,
      sortOrder: request.sort.order,
      sortProperty: request.sort.property,
      ...query
    }
    // fetch page over HTTP
    return this.http.get<Page<User>>('/users', {params})
    // transform the response to the Page type with RxJS map() if necessary
  }
}
```

Create the data source typed with the type you want to fetch and the corresponding query model. Pass a function pointing to your service and default values for the query and sort.

```ts
import { PaginationDataSource } from 'ngx-pagination-data-source'

@Component({...})
export class UsersComponent  {
    displayedColumns = ['id', 'name', 'email', 'registration']

    dataSource = new PaginatedDataSource<User, UserQuery>(
      (request, query) => this.users.page(request, query),
      {property: 'username', order: 'desc'},
      {search: '', registration: undefined}
    )

    constructor(private users: UserService) {
    }
}
```

Hook the data source to a table and paginator in your view. You can optionally add loading indication by e.g. hooking up a spinner to `dataSource.loading$`.

```html
<table mat-table [dataSource]="dataSource">
  <!-- column definitions -->
  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>
<mat-paginator *ngIf="dataSource.page$ | async as page"
  [length]="page.totalElements" [pageSize]="page.size"
  [pageIndex]="page.number" (page)="dataSource.fetch($event.pageIndex)">
</mat-paginator>
<mat-spinner *ngIf="dataSource.loading$ | async" diameter="32"></mat-spinner>
```
