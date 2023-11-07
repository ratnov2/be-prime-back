import { prop, Ref } from '@typegoose/typegoose'
import { TimeStamps, Base } from '@typegoose/typegoose/lib/defaultClasses'
import { MovieModel } from 'src/movie/movie.model'

export interface UserModel extends Base {}

export class IcalendarPhotos {
	@prop({ unique: true })
	created: string

	@prop()
	photo: string
}

export class UserModel extends TimeStamps {
	@prop({ unique: true })
	email: string

	@prop()
	password: string

	@prop({ default: false })
	isAdmin?: boolean

	@prop({ default: [], ref: () => MovieModel })
	favorites?: Ref<MovieModel>[]

	@prop({ default: [] })
	calendarPhotos?: IcalendarPhotos[]

	@prop({ default: { photoOne: null, photoTwo: null, photoThree: null } })
	favoritePhotos: {
		photoOne: string | null
		photoTwo: string | null
		photoThree: string | null
	}
	@prop({ default: '' })
	firstName?: string

	@prop({ default: '' })
	lastName?: string

	@prop({ default: '' })
	avatar?: string
}
