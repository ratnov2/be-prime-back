import {
	BadGatewayException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { genSalt, hash } from 'bcryptjs'
import mongoose, { Types } from 'mongoose'
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

	async findUsersByName(name: string, id: string) {
		const users = await this.userModel.find(
			{
				$expr: {
					$regexMatch: {
						input: { $concat: ['$firstName', ' ', '$lastName'] },
						regex: name, //Your text search here
						options: 'i',
					},
				},
			},

			{
				avatar: 1,
				_id: 1,
				firstName: 1,
				friendship: {
					$cond: {
						if: { $in: [new mongoose.mongo.ObjectId(id), '$friendship._id'] },
						then: {
							$map: {
								input: '$friendship',
								as: 'friend',
								in: {
									$cond: [
										{
											$eq: ['$$friend.id', new mongoose.mongo.ObjectId(id)],
										},
										{ id: '$$friend.id', status: '$$friend.status' },
										'$$friend',
									],
								},
							},
						},
						else: null,
					},
				},
				// 	id.length >= 12
				// 		? {
				// 				$elemMatch: {
				// 					_id: new mongoose.mongo.ObjectId(id),
				// 				},
				// 		  }
				// 		: 1,
			}
		)

		return users
	}
	async getLatestPhoto() {
		let latest = []
		let users = await this.userModel.find()
		users.map((el) => {
			let latestPhoto = {
				calendarPhotos: el.calendarPhotos[el.calendarPhotos.length - 1],
				name: el.firstName,
				_id: el._id,

				// gg: el.
			}
			if (latestPhoto.calendarPhotos) {
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
		friendId: { friendId: string; status: '0' | '1' | '2' | '3' }
	): Promise<DocumentType<UserModel> | null> {
		const user = await this.userModel.findById(id).exec()
		const friendUser = await this.userModel.findById(friendId.friendId).exec()
		//console.log(id, friendId.friendId);

		if (user._id.equals(friendUser._id))
			throw new NotFoundException('User not found')
		if (!user || !friendUser) throw new NotFoundException('User not found')
		if (friendId.status === ('11' as '1')) {
			user.friendship = [] as any
			friendUser.friendship = [] as any
		}
		if (friendId.status === '1') {
			//request in friend
			for (let i = 0; i < user.friendship.length; i++) {
				if (user.friendship[i]._id.equals(friendUser._id))
					throw new NotFoundException('request is already sented')
			}
			let newReq1 = {
				_id: friendUser._id,
				status: '1' as '1',
			}
			let newReq2 = { _id: user._id, status: '2' as '2' }
			user.friendship.push(newReq1)
			friendUser.friendship.push(newReq2)
		} else if (friendId.status === '3') {
			//add friends
			for (let i = 0; i < user.friendship.length; i++) {
				if (user.friendship[i]._id.equals(friendUser._id)) {
					let newObj = { ...user.friendship[i], status: '3' as '3' }
					user.friendship[i] = newObj
				}
			}
			for (let i = 0; i < friendUser.friendship.length; i++) {
				if (friendUser.friendship[i]._id.equals(user._id)) {
					let newObj = { ...friendUser.friendship[i], status: '3' as '3' }
					friendUser.friendship[i] = newObj
				}
			}
		} else if (friendId.status === '0') {
			//delete
			const lengthMax = Math.max(
				user.friendship.length,
				friendUser.friendship.length
			)
			let userIndexDelete = undefined
			let FriendIndexDelete = undefined
			for (let i = 0; i < lengthMax; i++) {
				if (user.friendship?.[i]?._id.equals(friendUser._id)) {
					userIndexDelete = i
				}

				if (friendUser.friendship?.[i]?._id.equals(user._id)) {
					FriendIndexDelete = i
				}
			}
			userIndexDelete !== undefined &&
				user.friendship.splice(userIndexDelete, 1)
			FriendIndexDelete !== undefined &&
				friendUser.friendship.splice(FriendIndexDelete, 1)
		}
		await user.save()
		await friendUser.save()
		return friendUser
	}
	async getAllFriend(id: string) {
		const user = await this.userModel.findById(id).exec()
		if (!user) throw new NotFoundException('User not found')
		let result = {
			friendship: await Promise.all(
				user.friendship.map(async (friend) => {
					let req = await this.userModel.findById(friend._id)
					let result = {
						friends: req,
						status: friend.status,
					}
					return result
				})
			),

			_id: user._id,
		}

		return result
	}
	async addMainMessage(id: string, message: string, created: Date) {
		let user = await this.userModel.findById(id).exec()
		if (!user) throw new NotFoundException('User not found')

		await this.userModel.updateOne(
			{ _id: id, 'calendarPhotos.created': new Date(created) },
			{ $set: { 'calendarPhotos.$.comment': message } } ///@@CHECK
		)

		return true
	}
	async addComment(
		id: string, //sentedUser
		data: { message: string; created: Date; userId: string }
	) {
		const sentedUser = await this.userModel.findById(id).exec()
		const user = await this.userModel.findById(data.userId).exec()
		//const friendUser = await this.userModel.findById(data.userId).exec()
		if (!user || !sentedUser) throw new NotFoundException('User not found')
		// let latestPhotoIndex = user.calendarPhotos.length - 1
		// if (user.calendarPhotos[latestPhotoIndex].photo === data.link) {
		// 	const newMessage = {
		// 		_id: sentedUser._id,
		// 		message: data.message,
		// 	}
		// 	user.calendarPhotos[latestPhotoIndex].comments.push(newMessage)
		// }
		// const newComment = {
		// 	_id: id,
		// 	message: data.message,
		// }

		let ff = await this.userModel.updateOne(
			{ _id: data.userId, 'calendarPhotos.created': new Date(data.created) },
			{
				$push: {
					'calendarPhotos.$.comments': {
						_id: id,
						message: data.message,
						created: new Date(),
					},
				},
			}
		)

		const user2 = await this.userModel.findById(data.userId).exec()

		await user.save()
		return true
	}
	async getPostUserByLink(
		id: string, //sentedUser
		data: { created: string; userId: string }
	) {
		const userPost = await this.userModel.findById(data.userId).exec()

		let ff = await this.userModel.findOne(
			{ _id: data.userId },
			{
				calendarPhotos: {
					$elemMatch: { created: data.created },
				},
			}
		)
		//console.log(ff.calendarPhotos[0].comments)
		//const users = ff.calendarPhotos[0].comments.map((el) => el._id)
		// const FF2 = await this.userModel
		// 	.find({
		// 		_id: {
		// 			$in: [...users],
		// 		},
		// 	})
		// 	.select(['_id','avatar'])
		const FF3 = await this.userModel.aggregate([
			{
				$match: {
					email: userPost.email,
					//_id:data.userId
				},
			},
			{
				$unwind: '$calendarPhotos',
			},
			{
				$group: {
					_id: '$calendarPhotos.comments',
				},
			},

			{
				$lookup: {
					from: 'User',
					localField: '_id._id',
					pipeline: [
						{
							$project: {
								email: 1,
								avatar: 1,
								firstName: 1,
							},
						},
					],
					foreignField: '_id',
					as: 'foret',
				},
			},
			{
				$project: {
					foret: 1,
				},
			},
		])

		const hashIds = {}
		FF3[0]?.foret.map((foret: { _id: string | number }) => {
			hashIds[foret._id] = foret
		})
		const result = []
		FF3[0]?._id.map((_id: any) => {
			const newComment = {
				...hashIds[_id._id],
				message: _id.message,
				created: _id.created,
			}
			result.push(newComment)
		})
		console.log(result)

		return result
	}
	async getCommentByLink(
		id: string, //sentedUser
		data: { link: string; userId: string }
	) {
		const userPost = await this.userModel.findById(data.userId).exec()
		let latestsPhoto =
			userPost.calendarPhotos[userPost.calendarPhotos.length - 1]
		for (let i = 0; i < latestsPhoto.comments.length; i++) {
			latestsPhoto.comments[i].message
		}
	}
	//comments
	// async addCommentuser(
	// 	id: string,
	// 	data: { message: string; link: string; userId: string }
	// ) {

	// }
}

//1user touch getAddFriend -> status(1) ->user[friend[user2,status:1]] user[friend[user1,status:1]]
//2user	click take question friend ->status(2) -> user[friend[user2,status:2]] user[friend[user1,status:2]]
