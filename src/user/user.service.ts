import {
	BadGatewayException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { genSalt, hash } from 'bcryptjs'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import {
	UpdateDto,
	UpdateDtoFavoritePhotos,
	UpdateInfoDto,
} from './dto/update.dto'
import { IcalendarPhotos, UserModel } from './user.model'

@Injectable()
export class UserService {
	constructor(
		@InjectModel(UserModel) private readonly userModel: ModelType<UserModel>
	) {}

	async byId(id: string): Promise<DocumentType<UserModel>> {
		const user = await this.userModel.findById(id).exec()
		if (user) return user
		throw new NotFoundException('User not found')
	}

	async getCalendarPhotos(id: string): Promise<IcalendarPhotos[]> {
		const user = await this.userModel.findById(id).exec()

		if (user) return user.calendarPhotos

		throw new NotFoundException('User not found')
	}

	async updateFavoritePhotos(id: string, data: UpdateDtoFavoritePhotos) {
		const user = await this.userModel.findById(id).exec()
		let defaultKeys = ['photoOne', 'photoTwo', 'photoThree']
		let key = data.key
		console.log(defaultKeys.indexOf(key), defaultKeys.indexOf(key), key)
		if (!user) throw new NotFoundException('user not found')
		if (defaultKeys.indexOf(key) === -1)
			throw new BadGatewayException('Bad Key')
		if (!data.photo) throw new BadGatewayException('Bad photo')

		let OBJ = { ...user.favoritePhotos }
		OBJ[key] = data.photo
		user.favoritePhotos = OBJ
		await user.save()
		return
	}

	// async updateProfile(_id: string, data: UpdateDto) {
	// 	const user = await this.userModel.findById(_id)
	// 	const isSameUser = await this.userModel.findOne({ email: data.email })

	// 	if (isSameUser && String(_id) !== String(isSameUser._id)) {
	// 		throw new NotFoundException('Email busy')
	// 	}

	// 	if (user) {
	// 		if (data.password) {
	// 			const salt = await genSalt(10)
	// 			user.password = await hash(data.password, salt)
	// 		}
	// 		user.email = data.email
	// 		if (data.isAdmin || data.isAdmin === false) user.isAdmin = data.isAdmin

	// 		await user.save()
	// 		return
	// 	}

	// 	throw new NotFoundException('User not found')
	// }

	async updateProfileInfo(_id: string, data: UpdateInfoDto) {
		console.log('@@@');
		
		let user = await this.userModel.findById(_id)
		user.lastName = data.lastName
		user.firstName = data.firstName
		user.avatar = data.avatar
		await user.save()
		return user
	}
	async getFavoriteMovies(_id: string) {
		return this.userModel
			.findById(_id, 'favorites')
			.populate({
				path: 'favorites',
				populate: {
					path: 'genres',
				},
			})
			.exec()
			.then((data) => {
				return data.favorites
			})
	}

	async toggleFavorite(movieId: Types.ObjectId, user: UserModel) {
		const { favorites, _id } = user

		await this.userModel.findByIdAndUpdate(_id, {
			favorites: favorites.includes(movieId)
				? favorites.filter((id) => String(id) !== String(movieId))
				: [...favorites, movieId],
		})
	}

	async getCount() {
		return this.userModel.find().count().exec()
	}
	async getLatestPhoto() {
		let latest = []
		let users = await this.userModel.find()
		users.map((el) => {
			let latestPhoto = {
				calendarPhotos: el.calendarPhotos[el.calendarPhotos.length - 1],
				name: el.firstName,

				// gg: el.
			}
			if (!latestPhoto.calendarPhotos) {
				latest.push(latestPhoto)
			}
		})
		return latest
	}
	async getAll(searchTerm?: string): Promise<DocumentType<UserModel>[]> {
		let options = {}

		if (searchTerm) {
			options = {
				$or: [
					{
						email: new RegExp(searchTerm, 'i'),
					},
				],
			}
		}

		return this.userModel
			.find(options)
			.select('-password -updatedAt -__v')
			.sort({ createdAt: 'desc' })
			.exec()
	}

	async delete(id: string): Promise<DocumentType<UserModel> | null> {
		return this.userModel.findByIdAndDelete(id).exec()
	}
}
