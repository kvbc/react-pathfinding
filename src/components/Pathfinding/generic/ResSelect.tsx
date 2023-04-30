// Responsive Selection Box

import { ChangeEvent, useState } from "react"

export type TOption = {
    name: string
    value: any
}

interface IProps {
    options: readonly TOption[]
    onChange?: (value: any) => void
}

function ResSelect ({ options, onChange = () => {} }: IProps) {
    const [selectedName, setSelectedName] = useState<string>(options[0].name)

    // 
    // 
    // 

    function handleChange (event: ChangeEvent<HTMLSelectElement>) {
        let name = event.target.value
        setSelectedName(name)

        let value = options.find(option => option.name == name)?.value
        onChange(value)
    }

    return <select
        value = {selectedName}
        className = "w-40 bg-slate-800 text-slate-50 p-1"
        onChange = {handleChange}
    >
        {options.map(option =>
            <option value={option.name}>{option.name}</option>
        )}
    </select>
}

export default ResSelect