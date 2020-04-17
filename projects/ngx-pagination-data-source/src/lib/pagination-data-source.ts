import {SimpleDataSource} from './simple-data-source'
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs'
import {Page, PaginationEndpoint, Sort} from './page'
import {map, shareReplay, startWith, switchMap} from 'rxjs/operators'
import {indicate} from './indicate'

export class PaginationDataSource<T, Q = Partial<T>> implements SimpleDataSource<T> {
  private readonly pageNumber = new Subject<number>()
  private readonly sort: BehaviorSubject<Sort<T>>
  private readonly query: BehaviorSubject<Q>
  private readonly loading = new Subject<boolean>()

  public loading$ = this.loading.asObservable()
  public page$: Observable<Page<T>>

  constructor(
    private endpoint: PaginationEndpoint<T, Q>,
    initialSort: Sort<T>,
    initialQuery: Q,
    public pageSize = 20) {
    this.query = new BehaviorSubject<Q>(initialQuery)
    this.sort = new BehaviorSubject<Sort<T>>(initialSort)
    const param$ = combineLatest([this.query, this.sort])
    this.page$ = param$.pipe(
      switchMap(([query, sort]) => this.pageNumber.pipe(
        startWith(0),
        switchMap(page => this.endpoint({page, sort, size: this.pageSize}, query)
          .pipe(indicate(this.loading))
        )
      )),
      shareReplay(1)
    )
  }

  sortBy(sort: Partial<Sort<T>>): void {
    const lastSort = this.sort.getValue()
    const nextSort = {...lastSort, ...sort}
    this.sort.next(nextSort)
  }

  queryBy(query: Partial<Q>): void {
    const lastQuery = this.query.getValue()
    const nextQuery = {...lastQuery, ...query}
    this.query.next(nextQuery)
  }

  fetch(page: number): void {
    this.pageNumber.next(page)
  }

  connect(): Observable<T[]> {
    return this.page$.pipe(map(page => page.content))
  }

  disconnect(): void {
  }

}
