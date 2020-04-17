import {defer, Observable, Subject} from 'rxjs'
import {finalize} from 'rxjs/operators'

export function indicate<T>(indicator: Subject<boolean>): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => source.pipe(
    source => defer(() => {
      indicator.next(true)
      return source
    }),
    finalize(() => indicator.next(false))
  )
}
