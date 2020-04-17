import {PaginationDataSource} from './pagination-data-source'
import {forkJoin, of, Subject} from 'rxjs'
import {Page, Sort} from './page'
import {first, take, toArray} from 'rxjs/operators'
import createSpy = jasmine.createSpy

interface User {
  id: number
  name: string
}

interface UserQuery {
  search: string
}

describe('PaginationDatasource', () => {
  it('should query endpoint with initial', done => {
    const sort: Sort<User> = {order: 'asc', property: 'name'}
    const query: UserQuery = {search: ''}
    const page: Page<User> = {content: [{id: 1, name: 'Lorem'}], totalElements: 0, size: 0, number: 0}
    const spy = createSpy('endpoint')
      .and.callFake(() => (of(page)))
    const source = new PaginationDataSource<User, UserQuery>(spy, sort, query)
    expect(spy).not.toHaveBeenCalled()
    source.connect().subscribe(users => {
      expect(users).toEqual(page.content)
      expect(spy).toHaveBeenCalledWith({page: 0, size: 20, sort}, query)
      done()
    })
  })

  it('should query endpoint with inputs', done => {
    const initialSort: Sort<User> = {order: 'asc', property: 'name'}
    const initialQuery: UserQuery = {search: ''}
    const allPages = [
      {content: [{id: 1, name: `User[1]`}], totalElements: 100, size: 1, number: 1},
      {content: [{id: 2, name: `User[2]`}], totalElements: 100, size: 1, number: 1},
      {content: [{id: 3, name: `User[3]`}], totalElements: 100, size: 1, number: 1},
      {content: [{id: 4, name: `User[4]`}], totalElements: 100, size: 1, number: 3}
    ]
    let page = 0
    const spy = createSpy('endpoint').and.callFake(() => of(allPages[page++]))
    const source = new PaginationDataSource<User, UserQuery>(spy, initialSort, initialQuery, 1)
    const page$ = source.page$.pipe(take(4), toArray())
    const content$ = source.connect().pipe(take(4), toArray())
    forkJoin([content$, page$])
      .subscribe(([contents, pages]) => {
        expect(contents).toEqual(allPages.map(p => p.content))
        expect(pages).toEqual(allPages)
        const [firstArgs, secondArgs, thirdArgs, fourthArgs] = spy.calls.allArgs()
        expect(firstArgs).toEqual([{page: 0, size: 1, sort: initialSort}, initialQuery])
        expect(secondArgs).toEqual([{page: 0, size: 1, sort: initialSort}, {search: 'lorem'}])
        expect(thirdArgs).toEqual([{page: 0, size: 1, sort: {order: 'desc', property: 'id'}}, {search: 'lorem'}])
        expect(fourthArgs).toEqual([{page: 3, size: 1, sort: {order: 'desc', property: 'id'}}, {search: 'lorem'}])
        done()
      })
    source.queryBy({search: 'lorem'})
    source.sortBy({order: 'desc', property: 'id'})
    source.fetch(3)
  })

  it('should indicate loading', async () => {
    const sink = new Subject<Page<User>>()
    const spy = createSpy('endpoint').and.callFake(() => sink)
    const source = new PaginationDataSource<User, UserQuery>(spy,
      {order: 'asc', property: 'name'}, {search: ''})
    const firstLoading$ = source.loading$.pipe(take(1)).toPromise()
    source.connect().pipe(first()).subscribe()
    expect(await firstLoading$).toEqual(true)
    const secondLoading$ = source.loading$.pipe(take(1)).toPromise()
    sink.next({content: [{id: 1, name: `Lorem`}], totalElements: 100, size: 1, number: 1})
    sink.complete()
    expect(await secondLoading$).toEqual(false)
  })
})
