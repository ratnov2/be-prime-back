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
		console.log('@@@')

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

	//FRIEND

	async addFriend(
		id: string,
		friendId: { friendId: string; status: '0' | '1' | '2' }
	): Promise<DocumentType<UserModel> | null> {
		const user = await this.userModel.findById(id).exec()
		const friendUser = await this.userModel.findById(friendId).exec()
		if (!user || !friendUser) throw new NotFoundException('User not found')
		if (friendId.status === '1') {
			for (let i = 0; i < user.friendship.length; i++) {
				if (user.friendship[i]._id === friendId.friendId)
					throw new NotFoundException('User not found2')
				else break
			}
			let newReq1 = {
				_id: friendUser._id as unknown as string,
				status: '1' as '1',
			}
			let newReq2 = { _id: user._id as unknown as string, status: '1' as '1' }
			user.friendship.push(newReq1)
			friendUser.friendship.push(newReq2)
		} else if (friendId.status === '2') {
			for (let i = 0; i < user.friendship.length; i++) {
				if (user.friendship[i]._id === friendId.friendId)
					throw new NotFoundException('User not found2')
				else break
			}
			let newReq1 = {
				_id: friendUser._id as unknown as string,
				status: '2' as '2',
			}
			let newReq2 = { _id: user._id as unknown as string, status: '2' as '2' }
			user.friendship.push(newReq1)
			friendUser.friendship.push(newReq2)
		} else if (friendId.status === '0') {
			//delete
			for (let i = 0; i < user.friendship.length; i++) {
				if (user.friendship[i]._id === friendId.friendId)
					throw new NotFoundException('User not found2')
				else break
			}
			const lengthMax = Math.max(
				user.friendship.length,
				friendUser.friendship.length
			)
			for (let i = 0; i < lengthMax; i++) {
				if (user.friendship[i]?._id === friendId.friendId) {
					user.friendship.splice(i, i + 1)
				}
				if (friendUser.friendship[i]?._id === (user._id as unknown as string)) {
					friendUser.friendship.splice(i, i + 1)
				}
			}
		}
		await user.save()
		await friendUser.save()
		
		return user
	}
	async getAllFriend(id: string): Promise<Promise<any>[]> {
		const user = await this.userModel.findById(id).exec()
		if (!user) throw new NotFoundException('User not found')
		let result = user.friendship.map(async (friend) => {
			return await this.userModel.findById(friend._id)
		})

		return result
	}
}

//1user touch getAddFriend -> status(1) ->user[friend[user2,status:1]] user[friend[user1,status:1]]
//2user	click take question friend ->status(2) -> user[friend[user2,status:2]] user[friend[user1,status:2]]
