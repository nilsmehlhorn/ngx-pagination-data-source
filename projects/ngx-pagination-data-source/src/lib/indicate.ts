import {defer, Observable, Subject} from 'rxjs'
import {finalize} from 'rxjs/operators'

export function indicate<T>(indicator: Subject<boolean>): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => source.pipe(
    s => defer(() => {
      indicator.next(true)
      return s
    }),
    finalize(() => indicator.next(false))
  )
}
