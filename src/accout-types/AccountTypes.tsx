import Image from 'next/image'

import style from './AccountTypes.module.scss'
import { AccountTypeData } from './account-types.data'

const AccountTypes = () => {
	return (
		<div className={style.accountTypes}>
			<h2>Choose the Best Account Type for You</h2>
			<div className={style.elements}>
				{AccountTypeData.map((el, key) => (
					<div key={key}>
						<Image
							width={120}
							height={122}
							alt='account-type'
							src={el.img}
						/>
						<p>{el.title}</p>
					</div>
				))}
			</div>
		</div>
	)
}
export default AccountTypes
