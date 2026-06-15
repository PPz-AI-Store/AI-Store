export
type I_provider = 'aliyun'

export
type I_product_key
	= 'img__remove_passersby'
	| 'img__make_ID_photo'
	| 'img__common_gen_edit_img'

export
interface I_abstract_product {
	key: I_product_key
	title: string
	enable: boolean
}

export
interface I_product__llm extends I_abstract_product {
	model: I_ai_model[]
}

export
interface I_product__api extends I_abstract_product {
}

export
type I_product = I_product__llm | I_product__api

export
interface I_ai_model {
	key: string
	provider: I_provider
	price: {
		cost: bigint
		sale: bigint
	}
}
