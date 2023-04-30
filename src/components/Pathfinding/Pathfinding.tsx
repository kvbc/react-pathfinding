import { useEffect, useState, useMemo } from "react"
import Xarrow, { Xwrapper } from "react-xarrows"
import { FaPlay, FaPause } from "react-icons/fa"

import assert from "../../common/assert"
import useWindowSize from "../../hooks/useWindowSize"

import * as World from "./types/World/index"
import { EAlgorithm, EHeuristic } from "./types/World/Pathfinding"

import { TVector2, TReadonlyVector2 } from "./types/generic/Vector2"
import TObjectKeyGenerator from "./types/generic/ObjectKeyGenerator"

import FieldCell from "./FieldCell"
import ResSelect from "./generic/ResSelect"

interface IProps {
    height: number
}

function Pathfinding ({ height }: IProps) {
    enum EDraggingState {
        NONE,
        WALLS,
        AGENT,
        AGENT_TARGET
    }

    const [, setRerender] = useState<Object>({})
    const [isPlaying, setIsPlaying] = useState<boolean>(false)
    const objectKeyGenerator = useMemo(() => new TObjectKeyGenerator(), [])

    const [draggingState, setDraggingState] = useState<EDraggingState>(EDraggingState.NONE)
    const [isFirstWall, setIsFirstWall] = useState<boolean | null>(null)
    
    const [selectedAgent, __setSelectedAgent] = useState<World.Agent.TAgent | null>(null)

    const windowSize = useWindowSize()
    
    function setSelectedAgent (newSelectedAgent: World.Agent.TAgent | null): void {
        if (selectedAgent !== null)
            world.getAgentRecord(selectedAgent).getBasePathfindingInput().setIsUsingDelay(false)
        if (newSelectedAgent !== null)
            world.getAgentRecord(newSelectedAgent).getBasePathfindingInput().setIsUsingDelay(true)

        __setSelectedAgent(newSelectedAgent)
    }

    const world = useMemo(() => {
        let worldSize = getWorldSize()
        return new World.TWorld(worldSize.getX(), worldSize.getY())
    }, [])

    function getWorldSize (): TVector2 {
        return new TVector2(
            Math.floor(Math.min(windowSize.width, 2560) / 53), // magic ratio
            height
        )
    }

    useEffect(() => {
        let newWorldSize = getWorldSize()
        world.getCellField().resize(newWorldSize.getX(), newWorldSize.getY(), () => new World.TCell())
    }, [height, windowSize])

    useEffect(() => {
        if (draggingState === EDraggingState.NONE) {
            setIsFirstWall(null)
        }
    }, [draggingState])

    useEffect(() => {
        world.getUpdateEvent().addListener(() => {
            setRerender({}) // force rerender
        })
    }, [])
    
    /*
     *
     *
     * 
     */

    function switchFieldCell (cell: World.TCell): void {
        let cellPosition = cell.getPosition()
        if (world.getAgentCollection().hasAt(cellPosition))
            return

        for (let agent of world.getAgentCollection().getAll())
            if (cellPosition.equals(agent.getTargetPosition()))
                return

        let shouldSwitch: boolean
        if (isFirstWall === null) {
            setIsFirstWall(cell.isWall())
            shouldSwitch = true
        }
        else {
            shouldSwitch = (cell.isWall() === isFirstWall)
        }
    
        if (shouldSwitch) {
            cell.setIsWall(!cell.isWall())
            world.requestUpdate()
        }
    }

    function getPositionToFieldCellID (position: TReadonlyVector2) {
        return `cell_${position.getX()}_${position.getY()}`
    }

    /*
     * 
     * Event Handlers
     * 
     */

    //
    // Field
    //

    function handleFieldMouseDown (event: React.MouseEvent): void {
        event.preventDefault() // prevent dragging
    }
    
    function handleFieldMouseUp (event: React.MouseEvent): void {
        if (event.button === 0)
            setDraggingState(EDraggingState.NONE)
    }

    function handleFieldMouseLeave (event: React.MouseEvent): void {
        setDraggingState(EDraggingState.NONE)
    }

    function handleFieldContextMenu (event: React.MouseEvent) {
        event.preventDefault()
    }

    //
    // Field Cell
    //

    function handleFieldCellMouseDown (event: React.MouseEvent, _cell: World.TReadonlyCell): void {
        let cell = world.getCellField().getCellAt(_cell.getPosition())

        event.preventDefault() // prevent dragging
        if (event.button !== 0)
            return

        let cellPosition = cell.getPosition()
        let agent = selectedAgent

        if (
            (selectedAgent === null) ||
            (!selectedAgent.getTargetPosition().equals(cellPosition) && !selectedAgent.getPosition().equals(cellPosition))
        ) {
            const agentAt = world.getAgentCollection().safeGetAt(cellPosition)
            if (agentAt !== null) {
                let newAgent: World.Agent.TAgent | null = agentAt

                if (agentAt === selectedAgent)
                    newAgent = null

                setSelectedAgent(newAgent)
                agent = newAgent
            }
        }

        if (agent !== null) {
            if (agent.getTargetPosition().equals(cellPosition)) {
                setDraggingState(EDraggingState.AGENT_TARGET)
                return
            }
            else if (agent.getPosition().equals(cellPosition)) {
                setDraggingState(EDraggingState.AGENT)
                return
            }
        }

        switchFieldCell(cell)
        setSelectedAgent(null)
        setDraggingState(EDraggingState.WALLS)
    }

    function handleFieldCellMouseEnter (event: React.MouseEvent, _cell: World.TReadonlyCell): void {
        let cell = world.getCellField().getCellAt(_cell.getPosition())

        if (draggingState === EDraggingState.NONE)
            return

        if ([EDraggingState.AGENT, EDraggingState.AGENT_TARGET].includes(draggingState)) {
            assert(selectedAgent !== null)

            let cellPosition = cell.getPosition()

            if (!cell.isWall()) {
                switch (draggingState) {
                case EDraggingState.AGENT_TARGET:
                    if (world.getAgentCollection().safeGetAt(cellPosition) !== selectedAgent) {
                        let target: World.Agent.TTarget = cellPosition
                        const targetAgent = world.getAgentCollection().safeGetAt(cellPosition)
                        if (targetAgent !== null)
                            target = targetAgent
        
                        selectedAgent.setTarget(target)
                        world.requestUpdate()
                    }
                    break
                case EDraggingState.AGENT:
                    if (!world.getAgentCollection().hasAt(cellPosition)) {
                        world.getAgentCollection().setAgentPosition(selectedAgent, cellPosition)
                        world.requestUpdate()
                    }
                    break
                }
            }
        }
        else if (draggingState === EDraggingState.WALLS)
            switchFieldCell(cell)
    }

    function handleFieldCellContextMenu (event: React.MouseEvent, cell: World.TReadonlyCell): void {
        event.preventDefault()

        if (cell.isWall())
            return

        const cellPosition = cell.getPosition()

        const agent = world.getAgentCollection().safeGetAt(cellPosition)

        if (agent !== null) {
            if (agent === selectedAgent)
                setSelectedAgent(null)
            world.getAgentCollection().delete(agent)
        }
        else {
            world.getAgentCollection().add(new World.Agent.TAgent(
                cellPosition,
                new TVector2(cellPosition.getX(), cellPosition.getY() + 1)
            ))
        }

        world.requestUpdate()
    }

    /*
     *
     *
     * 
     */

    function handlePlayButtonClick () {
        world.setIsPaused(!isPlaying)
        setIsPlaying(!isPlaying)
    }

    /*
     *
     * Render
     * 
     */

    return <div>
        <Xwrapper>
            <div
                onMouseDown = {handleFieldMouseDown}
                onMouseUp = {handleFieldMouseUp}
                onMouseLeave = {handleFieldMouseLeave}
                onContextMenu = {handleFieldContextMenu}
                className = "flex flex-col max-w-fit gap-1 p-3 min-w-full"
            >
                {world.getCellField().to2DArray().map((row, y) =>
                    <div
                        key = {y}
                        className = "flex gap-1 justify-center"
                    >
                        {row.map((cell, x) => {
                            const position = new TVector2(x, y)
                            const agent = world.getAgentCollection().safeGetAt(position)

                            let isSelectedAgent = false
                            if (agent !== null)
                                isSelectedAgent = (agent === selectedAgent)

                            let isSelectedAgentTargetPosition = false
                            if (selectedAgent !== null)
                                isSelectedAgentTargetPosition = (position.equals(selectedAgent.getTargetPosition()))

                            let pathfindingCell = null
                            if (selectedAgent !== null) {
                                let lastPathfindingResult = world.getAgentRecord(selectedAgent).getLastPathfindingResult()
                                if (lastPathfindingResult !== null) {
                                    pathfindingCell = lastPathfindingResult.getField().getCellAt(position)
                                }
                            }

                            let agentID = null
                            if (agent !== null)
                                agentID = world.getAgentCollection().getID(agent)

                            let agentRecord = null
                            if (agent !== null)
                                agentRecord = world.getAgentRecord(agent)

                            return <FieldCell
                                key = {x}
                                cell = {cell}
                                pathfindingCell = {pathfindingCell}
                                agent = {agent}
                                agentID = {agentID}
                                agentRecord = {agentRecord}
                                id = {getPositionToFieldCellID(position)}
                                isSelected = {isSelectedAgent || isSelectedAgentTargetPosition}
                                onMouseEnter = {handleFieldCellMouseEnter}
                                onMouseDown = {handleFieldCellMouseDown}
                                onContextMenu = {handleFieldCellContextMenu}
                            />
                        })}
                    </div>
                )}
            </div>

            {selectedAgent && <Xarrow
                start = {getPositionToFieldCellID(selectedAgent.getPosition())}
                end = {getPositionToFieldCellID(selectedAgent.getTargetPosition())}
                showHead = {false}
                passProps = {{pointerEvents: "none"}}
            />}

            {world.getAgentCollection().getAll().map(agent => {
                let lastPathfindingResult = world.getAgentRecord(agent).getLastPathfindingResult()
                if (lastPathfindingResult === null)
                    return
                let lastPathfindingPath = lastPathfindingResult.getPath()
                if (lastPathfindingPath === null)
                    return
                let arrows: JSX.Element[] = []
                const lastIndex = lastPathfindingPath.length - 1
                for (let i = 0; i < lastIndex; i++) {
                    arrows.push(<Xarrow
                        key = {i}
                        start = {getPositionToFieldCellID(lastPathfindingPath[i])}
                        end = {getPositionToFieldCellID(lastPathfindingPath[i + 1])}
                        tailShape = "circle"
                        showTail = {i === 0}
                        showHead = {i === lastIndex - 1}
                        headShape = {world.getAgentCollection().hasAt(lastPathfindingPath[i + 1]) ? "circle" : "arrow1"}
                        startAnchor = "middle"
                        endAnchor = "middle"
                        path = "straight"
                        passProps = {{pointerEvents: "none"}}
                    />)
                }
                return <div
                    key = {objectKeyGenerator.getKey(lastPathfindingPath)}
                >{arrows}</div>
            })}

        </Xwrapper>

        <div className="h-screen bg-slate-100 p-6 shadow-sm flex">
            <div className="w-fit p-6 border-r-4 border-r-slate-200 flex">
                <div className="w-full">
                    <button onClick={handlePlayButtonClick} className="p-6 flex justify-center items-center bg-slate-800 text-slate-100 border-transparent rounded-full text-lg cursor-pointer">
                            { isPlaying ? <FaPause /> : <FaPlay /> }
                    </button>
                </div>
            </div>
            <div className="w-full p-6">
                <h1 className="text-5xl font-bold mb-3">
                    Agent&nbsp;
                    {(selectedAgent !== null) && <>#{world.getAgentCollection().getID(selectedAgent)}</>}
                </h1>
                {
                    (selectedAgent === null)
                    ? <h2 className="text-slate-400">No agent selected</h2>
                    : <>
                        <h2 className="text-slate-400 mb-7">
                            ({selectedAgent.getPosition().getX()}, {selectedAgent.getPosition().getY()})
                            &gt;&nbsp;
                            {(selectedAgent.getTarget() instanceof World.Agent.TAgent)
                                ? <>Agent #{world.getAgentCollection().getID(selectedAgent.getTarget() as World.Agent.TAgent)}</>
                                : <>({selectedAgent.getTargetPosition().getX()}, {selectedAgent.getTargetPosition().getY()})</>
                            }
                            <br />
                            {(() => {
                                let status = world.getAgentRecord(selectedAgent).getStatus()
                                if (status === null)
                                    return
                                let statusName = World.EAgentStatus[status]
                                return statusName[0] + statusName.slice(1).toLowerCase()
                            })()}
                        </h2>
                        {(() => {
                            let input = world.getAgentRecord(selectedAgent).getBasePathfindingInput()

                            let algorithm = input.getAlgorithm()
                            let heuristic = input.getHeuristic()

                            return <div className="flex flex-col gap-1">
                                <div className="flex">
                                    <div className="w-32">Algorithm:</div>
                                    <ResSelect
                                        options = {[
                                            { name: "A*", value: EAlgorithm.ASTAR }
                                        ]}
                                        onChange = {(algo: EAlgorithm) => {
                                            input.setAlgorithm(algo)
                                        }}
                                    />    
                                </div>
                                <div className="flex">
                                    <div className="w-32">Heuristic:</div>
                                    <ResSelect
                                        options = {[
                                            { name: "Euclidean", value: World.Pathfinding.EHeuristic.EUCLIDEAN },
                                            { name: "Manhattan", value: World.Pathfinding.EHeuristic.MANHATTAN },
                                            { name: "Diagonal",  value: World.Pathfinding.EHeuristic.DIAGONAL },
                                        ]}
                                        onChange = {(heuristic: EHeuristic) => {
                                            input.setHeuristic(heuristic)
                                        }}
                                    />
                                </div>
                            </div>
                        })()}
                    </>
                }
            </div>
        </div>
    </div>
}

export default Pathfinding