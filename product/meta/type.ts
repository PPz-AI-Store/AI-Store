export
type I_provider = 'aliyun'

export
interface I_product {
	key: string
	title: string
}

export
interface I_ai_model {
	key: string
	provider: I_provider
	price: {
		cost: bigint
		sale: bigint
	}
}
