import SlotForm from "./Forms/SlotForms"

const SlotGenerativHandle = () => {
    return (
        // flex = display: flex
        // gap-2 = gap: 0.5rem (8px)
        // flex-wrap = flex-wrap: wrap
        // p-4 = opcjonalny padding, żeby formularz nie dotykał krawędzi
        <div className="flex gap-2 flex-wrap p-4">
            <SlotForm 
                onSubmit={() => {}}
                isLoading={true}
                serverError={null}
            />
        </div>
    )
}

export default SlotGenerativHandle