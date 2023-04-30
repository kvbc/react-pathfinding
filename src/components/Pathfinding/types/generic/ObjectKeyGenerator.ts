class TObjectKeyGenerator {
    private _curKey = 1;
    private _keys = new WeakMap<Object, React.Key>()

    getKey (object: Object): React.Key {
        if (this._keys.has(object))
            return this._keys.get(object) as React.Key

        const id = this._curKey++
        this._keys.set(object, id)
        return id
    }
}

export default TObjectKeyGenerator