import { prop, Ref } from '@typegoose/typegoose'
import { TimeStamps, Base } from '@typegoose/typegoose/lib/defaultClasses'
import { ObjectId, Schema, Types } from 'mongoose'
import { MovieModel } from 'src/movie/movie.model'
import { TReaction } from './user.controller'

export interface UserModel extends Base {}

export class IcalendarPhotos {
	@prop({ unique: true })
	created: Date

	@prop()
	photos: {
		frontPhoto?: {
			created: Date
			photo: string
			locate: string
		}
		backPhoto?: {
			created: Date
			photo: string
			locate: string
		}
	}

	@prop({ default: '' })
	comment: string

	@prop({ default: [] })
	comments: {
		_id: Types.ObjectId
		message: string
	}[]

	@prop({ default: [] })
	photoReactions: { userId: string; reactionType: TReaction }[]
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

	@prop({
		default: {
			photoOne: null,
			photoTwo: null,
			photoThree: null,
		},
	})
	favoritePhotos: {
		photoOne: {
			frontPhoto: string
			backPhoto: string
			created: string
		} | null
		photoTwo: {
			frontPhoto: string
			backPhoto: string
			created: string
		} | null
		photoThree: {
			frontPhoto: string
			backPhoto: string
			created: string
		} | null
	}
	@prop({ default: '' })
	firstName?: string

	@prop({ default: '' })
	lastName?: string

	@prop({ default: '' })
	avatar?: string

	@prop({ default: [] })
	friendship?: [
		{
			_id: Types.ObjectId
			status: '0' | '1' | '2' | '3'
		}
	]
}
// 0 ожидание
// 1 запрос
// 2 подтверждение
