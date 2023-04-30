import assert from "../../../../../common/assert"

export type TParameters = ReadonlyArray<any>

export type TEventListener<_TDispatchParams extends TParameters> = (...args: _TDispatchParams) => void

export type TEventID = string

export class TListenableEvent<_TDispatchParams extends TParameters> {
    protected _listeners: Array<TEventListener<_TDispatchParams>> = []

    addListener (listener: TEventListener<_TDispatchParams>): void {
        assert(!this._listeners.includes(listener))
        this._listeners.push(listener)
    }
    
    removeListener (listener: TEventListener<_TDispatchParams>): void {
        assert(this._listeners.includes(listener))
        this._listeners = this._listeners.filter(l => l !== listener)
    }
}

export class TDispatchableEvent<_TDispatchParams extends TParameters> extends TListenableEvent<_TDispatchParams> {
    dispatch (...args: _TDispatchParams): void {
        this._listeners.forEach(listener => listener(...args))
    }
}