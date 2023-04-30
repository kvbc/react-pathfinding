import assert from "../../../../../common/assert"
import { TReadonlyVector2 } from "../../generic/Vector2"
import { TAgent, TReadonlyAgent } from "./Agent"

export class TAgentCollectionBase<T extends TReadonlyAgent> {
    protected _agents: Array<T> = []
    protected _agentIDs = new WeakMap<T, number>()

    getAll (): ReadonlyArray<T> {
        return this._agents
    }

    has (agent: TReadonlyAgent): boolean {
        return this._agents.includes(agent as T)
    }

    //
    //
    //

    safeGetAt (position: TReadonlyVector2): T | null {
        for (let agent of this._agents)
            if (agent.getPosition().equals(position))
                return agent
        return null
    }

    getAt (position: TReadonlyVector2): T {
        const agent = this.safeGetAt(position)
        assert(agent !== null)
        return agent
    }

    hasAt (position: TReadonlyVector2): boolean {
        return this.safeGetAt(position) !== null
    }

    getID (agent: T): number {
        assert(this._agentIDs.has(agent))
        return this._agentIDs.get(agent)!
    }
}

export class TReadonlyAgentCollection extends TAgentCollectionBase<TReadonlyAgent> {}

export class TAgentCollection extends TAgentCollectionBase<TAgent> {
    private _topID: number = 1

    add (agent: TAgent): void {
        assert(!this.hasAt(agent.getPosition()))
        this._agentIDs.set(agent, this._topID++)
        this._agents.push(agent)
    }

    delete (agent: TAgent): void {
        assert(this.has(agent))
        this._agents = this._agents.filter(_agent =>
            _agent !== agent    
        )
    }

    setAgentPosition (agent: TAgent, newPosition: TReadonlyVector2): void {
        assert(!this.hasAt(newPosition))
        agent._setPosition(newPosition)
    }
}