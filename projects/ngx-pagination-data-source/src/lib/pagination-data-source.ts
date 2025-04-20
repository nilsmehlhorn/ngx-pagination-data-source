import { SimpleDataSource } from './simple-data-source';
import { Page, PaginationEndpoint, Sort } from './page';
import { indicate } from './indicate';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

export type UpdateFn<T> = (last: T) => T;

export class PaginationDataSource<T, Q = Partial<T>>
  implements SimpleDataSource<T>
{
  public loading$: Observable<boolean>;
  public page$: Observable<Page<T>>;

  private readonly pageNumber = new Subject<number>();
  private readonly sort: BehaviorSubject<Sort<T>>;
  private readonly query: BehaviorSubject<Q>;
  private readonly loading = new Subject<boolean>();

  constructor(
    private endpoint: PaginationEndpoint<T, Q>,
    initialSort: Sort<T>,
    initialQuery: Q,
    public pageSize = 20,
    public initialPage = 0
  ) {
    let firstCall = true;
    this.query = new BehaviorSubject<Q>(initialQuery);
    this.sort = new BehaviorSubject<Sort<T>>(initialSort);
    const param$ = combineLatest([this.query, this.sort]);
    this.loading$ = this.loading.asObservable();
    this.page$ = param$.pipe(
      switchMap(([query, sort]) =>
        this.pageNumber.pipe(
          startWith(initialPage && firstCall ? initialPage : 0),
          tap(() => (firstCall = false)),
          switchMap((page) =>
            this.endpoint({ page, sort, size: this.pageSize }, query).pipe(
              indicate(this.loading)
            )
          )
        )
      ),
      shareReplay(1)
    );
  }

  sortBy(sortUpdate: Partial<Sort<T>> | UpdateFn<Sort<T>>): void {
    const lastSort = this.sort.getValue();
    const nextSort =
      typeof sortUpdate === 'function'
        ? sortUpdate(lastSort)
        : { ...lastSort, ...sortUpdate };
    this.sort.next(nextSort);
  }

  queryBy(queryUpdate: Partial<Q> | UpdateFn<Q>): void {
    const lastQuery = this.query.getValue();
    const nextQuery =
      typeof queryUpdate === 'function'
        ? queryUpdate(lastQuery)
        : { ...lastQuery, ...queryUpdate };
    this.query.next(nextQuery);
  }

  fetch(page: number, pageSize?: number): void {
    if (pageSize) {
      this.pageSize = pageSize;
    }
    this.pageNumber.next(page);
  }

  connect(): Observable<T[]> {
    return this.page$.pipe(map((page) => page.content));
  }

  disconnect(): void {}
}
