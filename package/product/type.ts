export
type I_provider = 'aliyun'

export
interface I_product {
	key: string
	title: string
}

export
interface I_ai_model {
	provider: I_provider
	name: string
	price: {
		cost: bigint
		sale: bigint
	}
}
