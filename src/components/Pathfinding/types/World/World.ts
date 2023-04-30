import assert from "../../../../common/assert"

import * as Field from "../generic/Field/index"
import * as Event from "../generic/Event/index"

import * as World from './index'
import { Pathfinding } from "./index"
import { Agent } from "./index"

/*
 *
 * Cell
 * 
 */

export class TReadonlyCell extends Field.TCell {
    protected _isWall: boolean = false

    isWall (): boolean {
        return this._isWall
    }
}

export class TCell extends TReadonlyCell {
    setIsWall (isWall: boolean): void {
        this._isWall = isWall
    }
}

/*
 *
 * Field
 * 
 */

export class TField extends Field.TField<TCell> {}
export class TReadonlyField extends Field.TField<TReadonlyCell> {}

/*
 *
 * Agent Record
 * 
 */

export enum EAgentStatus { // FIXME
    PATHFINDING,
    WAITING,
    MOVING
}

export class TAgentRecordBase<
    __TPublicPathfindingInputBase extends Pathfinding.TReadonlyInputBase | Pathfinding.TInputBase
> {
    protected _basePathfindingInput: __TPublicPathfindingInputBase
    protected _lastPathfindingResult: Pathfinding.TAnyResult | null = null
    protected _lastStatus: EAgentStatus | null = null
    protected _status: EAgentStatus | null = null

    constructor (basePathfindingInput: __TPublicPathfindingInputBase) {
        this._basePathfindingInput = basePathfindingInput
    }

    getLastStatus            (): EAgentStatus | null           { return this._lastStatus }
    getStatus                (): EAgentStatus | null           { return this._status }
    getBasePathfindingInput  (): __TPublicPathfindingInputBase { return this._basePathfindingInput as __TPublicPathfindingInputBase }
    getLastPathfindingResult (): null | Pathfinding.TAnyResult { return this._lastPathfindingResult }
}

export class TReadonlyAgentRecord extends TAgentRecordBase<Pathfinding.TReadonlyInputBase> {}

export class TAgentRecord extends TAgentRecordBase<Pathfinding.TInputBase> {
    setBasePathfindingInput (basePathfindingInput: Pathfinding.TInputBase): void {
        this._basePathfindingInput = basePathfindingInput
    }

    setLastPathfindingResult (lastPathfindingResult: Pathfinding.TAnyResult): void {
        this._lastPathfindingResult = lastPathfindingResult
    }

    setStatus (status: EAgentStatus): void {
        this._lastStatus = this._status
        this._status = status
    }
}

/*
 *
 * World
 * 
 */

const BASE_PATHFINDING_STEP_DELAY = 0 /*50*/ // in ms
const STEP_DELAY = 1000 // in ms

export class TWorldBase<
    _TPublicAgentCollection extends Agent.TReadonlyAgentCollection | Agent.TAgentCollection,
    _TPublicField extends TField | TReadonlyField,
    _TPublicAgentRecord extends TAgentRecord | TReadonlyAgentRecord,
    _TPublicGlobalPathfindingInput extends Pathfinding.TGlobalInput | Pathfinding.TReadonlyGlobalInput
> {
    protected _agentCollection: Agent.TAgentCollection = new Agent.TAgentCollection()
    protected _cellField: TField
    protected _agentRecords = new WeakMap<Agent.TReadonlyAgent, TAgentRecord>()
    protected _updateEvent = new Event.TDispatchableEvent<[]>()

    protected _isPaused: boolean = false
    protected _isPausedChangedEvent = new Event.TDispatchableEvent<[isPaused: boolean]>()
    
    protected _globalPathfindingInput = new Pathfinding.TGlobalInput(Promise.resolve(), BASE_PATHFINDING_STEP_DELAY)

    constructor (width: number, height: number) {
        assert(width > 0)
        assert(height > 0)
        this._cellField = new TField(width, height, () => 
            new TCell()
        )
    }

    //
    //
    //
    
    getAgentCollection (): _TPublicAgentCollection {
        return this._agentCollection as _TPublicAgentCollection
    }
    
    getCellField (): _TPublicField {
        return this._cellField as _TPublicField
    }

    getAgentRecord (agent: Agent.TReadonlyAgent): _TPublicAgentRecord {
        assert(this._agentCollection.has(agent))
        if (this._agentRecords.has(agent))
            return this._agentRecords.get(agent)! as _TPublicAgentRecord
        let record = new TAgentRecord(new Pathfinding.TInputBase(
            false,
            Pathfinding.EHeuristic.EUCLIDEAN,
            Pathfinding.EAlgorithm.ASTAR
        ))
        this._agentRecords.set(agent, record)
        return record as _TPublicAgentRecord
    }

    getUpdateEvent () {
        return this._updateEvent as Event.TListenableEvent<[]>
    }

    getGlobalPathfindingInput (): _TPublicGlobalPathfindingInput {
        return this._globalPathfindingInput as _TPublicGlobalPathfindingInput
    }
}

export class TReadonlyWorld extends TWorldBase<
    Agent.TReadonlyAgentCollection,
    TReadonlyField,
    TReadonlyAgentRecord,
    Pathfinding.TReadonlyGlobalInput
> {}

export class TWorld extends TWorldBase<
    Agent.TAgentCollection,
    TField,
    TAgentRecord,
    Pathfinding.TGlobalInput
> {
    requestUpdate () {
        this._updateEvent.dispatch()
    }

    setIsPaused (isPaused: boolean): void {
        this._isPaused = isPaused
        if (isPaused)
            this._globalPathfindingInput.setPausePromise(new Promise(resolve => {
                const listener = (isPaused: boolean) => {
                    if (!isPaused) {
                        this._isPausedChangedEvent.removeListener(listener)
                        resolve()
                    }
                }
                this._isPausedChangedEvent.addListener(listener)
            }))
        else
            this._globalPathfindingInput.setPausePromise(Promise.resolve())
        this._isPausedChangedEvent.dispatch(isPaused)
    }

    pause (): void {
        this.setIsPaused(true)
    }

    unpause (): void {
        this.setIsPaused(false)
    }

    constructor (...baseArgs: ConstructorParameters<typeof TWorldBase<Agent.TAgentCollection, TField, TAgentRecord, Pathfinding.TGlobalInput>>) {
        super(...baseArgs)

        // 
        //
        // 

        const repathfindAgentIfNecessary = async (agent: Agent.TAgent) => {
            let agentRecord = this.getAgentRecord(agent)

            // 
            // Pathfind
            // 

            const pathfind = async (agent: Agent.TAgent) => {
                agentRecord.setStatus(EAgentStatus.PATHFINDING)

                let walkableField = new Pathfinding.TInputField(
                    this._cellField.getWidth(),
                    this._cellField.getHeight(),
                    () => new Pathfinding.TInputCell(true)
                )
        
                walkableField.forEachCell(cell => {
                    let position = cell.getPosition()
                    if (this._cellField.getCellAt(position).isWall()) {
                        cell.setIsWalkable(false)
                        return
                    }
                    if (this._agentCollection.hasAt(position))
                    if (this._agentCollection.getAt(position) !== agent)
                    if (this._agentCollection.getAt(position) !== agent.getTarget())
                        cell.setIsWalkable(false)
                })
        
                let result = World.Pathfinding.pathfind(new Pathfinding.TInput(
                    walkableField,
                    agent.getPosition(),
                    agent.getTargetPosition(),
                    agentRecord.getBasePathfindingInput(),
                    this._globalPathfindingInput
                ))
        
                result.getRequestUpdateEvent().addListener(() => {
                    this.requestUpdate()
                })
                result.getPathPromise().then(() => {
                    this.requestUpdate()
                    agentRecord.setStatus(EAgentStatus.WAITING)
                })

                agentRecord.setLastPathfindingResult(result)

                if (!agentRecord.getBasePathfindingInput().isUsingDelay())
                    await result.getPathPromise()

                return Promise.resolve()
            }
    
            // 
            // 
            // 

            let lastPathfindingResult = agentRecord.getLastPathfindingResult()
            let shouldRepathfind = false

            if (lastPathfindingResult === null)
                shouldRepathfind = true
            else { 
                if (!agent.getTargetPosition().equals(lastPathfindingResult.getTargetPosition()))
                    shouldRepathfind = true
                else {
                    let path = lastPathfindingResult.getPath()
                    if (path !== null) {
                        let isAtAnyPos = false
                        for (let pos of path) {
                            if (pos.equals(agent.getPosition()))
                                isAtAnyPos = true
                            if (this.getCellField().getCellAt(pos).isWall())
                                shouldRepathfind = true
                            else {
                                let agentAt = this._agentCollection.safeGetAt(pos)
                                if (agentAt !== null)
                                if (agentAt !== agent)
                                if (agentAt !== agent.getTarget())
                                    shouldRepathfind = true
                            }
                            if (shouldRepathfind)
                                break
                        }
                        if (!isAtAnyPos)
                            shouldRepathfind = true
                    }
                }
            }

            if (shouldRepathfind)
                await pathfind(agent)

            return Promise.resolve()
        }

        // 
        // Step loop
        // 

        setInterval(async () => {
            if (this._isPaused)
                return

            let areAllPathsResolved = true

            for (let agent of this._agentCollection.getAll()) {
                await repathfindAgentIfNecessary(agent)

                let lastPathfindingResult = this.getAgentRecord(agent).getLastPathfindingResult()
                if (lastPathfindingResult === null)
                    continue

                if (lastPathfindingResult.getPath() === null) {
                    areAllPathsResolved = false
                    break
                }
            }

            if (!areAllPathsResolved)
                return

            for (let agent of this._agentCollection.getAll()) {
                let agentRecord = this.getAgentRecord(agent)

                agentRecord.setStatus(EAgentStatus.MOVING)

                // previous iterations of this loop might collide with current agent's path
                await repathfindAgentIfNecessary(agent)

                let lastPathfindingResult = agentRecord.getLastPathfindingResult()
                if (lastPathfindingResult === null)
                    continue
    
                let __path = lastPathfindingResult.getPath()
                if (__path === null)
                    continue
                let path = [...__path]
                // if (path.length === 0)
                //     agentRecord.setStatus(EAgentStatus.STUCK)
                // else if (path.length === 1)
                //     agentRecord.setStatus(EAgentStatus.TARGET_REACHED)
                if (agent.getTarget() instanceof Agent.TAgent) {
                    path.pop()
                }
    
                let pathIndex = path.findIndex(pos => pos.equals(agent.getPosition()))
                if (pathIndex === -1)
                    continue
    
                if (pathIndex === path.length - 1) // last index
                    continue
    
                agent._setPosition(path[pathIndex + 1])
            }

            this.requestUpdate()
        }, STEP_DELAY)
    }
}