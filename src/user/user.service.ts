import {
	BadGatewayException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { ModelType, DocumentType } from '@typegoose/typegoose/lib/types'
import { genSalt, hash } from 'bcryptjs'
import mongoose, { Mongoose, ObjectId, Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import {
	UpdateDto,
	UpdateDtoFavoritePhotos,
	UpdateInfoDto,
} from './dto/update.dto'

import { IcalendarPhotos, UserModel } from './user.model'
import { CronModel } from 'src/cron/cron.model'
import { TReaction } from './user.controller'
import { identity } from 'rxjs'
import { NotificationModel } from 'src/notification/notification.model'

@Injectable()
export class UserService {
	constructor(
		@InjectModel(UserModel) private readonly userModel: ModelType<UserModel>,
		@InjectModel(CronModel) private readonly cronModel: ModelType<CronModel>,
		@InjectModel(NotificationModel)
		private readonly notificationModel: ModelType<NotificationModel>
	) {}

	async getAllProfiles(): Promise<DocumentType<any>> {
		const user = await this.userModel.find()
		if (!user) throw new NotFoundException('User not found')

		return user
	}

	async byId(id: string): Promise<DocumentType<any>> {
		const user = await this.userModel.findById(id).exec()
		if (!user) throw new NotFoundException('User not found')
		const fields = returnUserFields(user)
		if (fields?.latestPhoto) {
			const reactions = await this.getReaction({
				created: fields.latestPhoto?.created as unknown as string,
				userId: fields._id as unknown as string,
			})
			fields.latestPhoto.photoReactions = reactions
		}

		return fields
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
		if (!user) throw new NotFoundException('user not found')
		if (defaultKeys.indexOf(key) === -1)
			throw new BadGatewayException('Bad Key')
		if (!data.photo) throw new BadGatewayException('Bad photo')

		let OBJ = { ...user.favoritePhotos }
		OBJ[key] = {
			photo: data.photo,
			created: data.created,
		}
		user.favoritePhotos = OBJ
		await user.save()
		return { message: true }
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
		if (!name) return

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
						if: { $in: [id, '$friendship._id'] },
						then: {
							$map: {
								input: '$friendship',
								as: 'friend',
								in: {
									$cond: [
										{
											$eq: ['$$friend.id', id],
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
	async getLatestPhotoFriends(_id: string) {
		const today = new Date()
		const existingCronData = await this.cronModel.findOne()
		if (!existingCronData) return
		const cronDate = new Date(existingCronData.lastRunTime)
		const user = await this.userModel.findById(_id)

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		const friendIds = user.friendship.map((el) => el._id)
		const friendsPhotos = await this.userModel.aggregate([
			{ $match: { _id: { $in: friendIds } } },
			{ $unwind: '$calendarPhotos' },
			{
				$match: {
					'calendarPhotos.created': { $gte: cronDate, $lte: today },
				},
			},
			{
				//@ts-ignore
				$group: {
					_id: '$_id',
					firstName: { $first: '$firstName' },
					avatar: { $first: '$avatar' },
					latestPhoto: { $last: '$calendarPhotos' },
				},
			},
			{
				$project: {
					//@ts-ignore
					_id: 1,
					firstName: 1,
					avatar: 1,
					latestPhoto: 1,
				},
			},
		])
		for (let i = 0; i < friendsPhotos.length; i++) {
			const reactions = await this.getReaction({
				created: friendsPhotos[i].latestPhoto.created as unknown as string,
				userId: friendsPhotos[i]._id as unknown as string,
			})
			friendsPhotos[i].latestPhoto.photoReactions = reactions
		}
		return friendsPhotos
	}
	async getLatestPhotoPeople() {
		const latestPhotos = await this.userModel.aggregate([
			{ $unwind: '$calendarPhotos' },
			{
				//@ts-ignore
				$group: {
					_id: '$_id',
					latestPhoto: { $last: '$calendarPhotos' },
				},
			},
			{
				$sort: {
					'latestPhoto.created': -1, // Сортировка в порядке убывания по времени создания
				},
			},
		])

		// Заполнение информации о пользователях (имя, аватар и т.д.)
		const populatedLatestPhotos = (await this.userModel.populate(latestPhotos, {
			path: '_id',
			select: 'firstName avatar', // Выбор нужных полей
		})) as unknown as {
			_id: string
			firstName: string
			avatar: string
			latestPhoto: {
				created: string
				comment: string
				comments: Array<any>
				photos: Array<any>
				photoReactions: { userId: string; reactionType: TReaction }[]
			}
		}[]
		for (let i = 0; i < populatedLatestPhotos.length; i++) {
			const reactions = await this.getReaction({
				created: populatedLatestPhotos[i].latestPhoto
					.created as unknown as string,
				userId: populatedLatestPhotos[i]._id as unknown as string,
			})
			populatedLatestPhotos[i].latestPhoto.photoReactions = reactions
		}

		return populatedLatestPhotos
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
		friendId: { friendId: string; status: '0' | '1' | '2' | '3' },
		sendNotification: (deviceToken: string, message2: string) => Promise<void>
	): Promise<DocumentType<any> | null> {
		const user = await this.userModel.findById(id).exec()
		const friendUser = await this.userModel.findById(friendId.friendId).exec()
		//console.log(id, friendId.friendId);
		let status = '0'
		const friendship: any = []
		let friendshipObj = { _id: '' as any, status: '' }
		if (user._id.equals(friendUser._id))
			throw new NotFoundException('User not found')
		if (!user || !friendUser) throw new NotFoundException('User not found')
		//test
		if (friendId.status === ('11' as '1')) {
			user.friendship = [] as any
			friendUser.friendship = [] as any
		}
		if (friendId.status === ('add_All' as '1')) {
			for (let i = 0; i < user.friendship.length; i++) {
				if (user.friendship[i]._id.equals(friendUser._id)) {
					let newObj = { ...user.friendship[i], status: '2' as '2' }
					user.friendship[i] = newObj
				}
			}
			for (let i = 0; i < friendUser.friendship.length; i++) {
				if (friendUser.friendship[i]._id.equals(user._id)) {
					let newObj = { ...friendUser.friendship[i], status: '2' as '2' }
					friendUser.friendship[i] = newObj
					friendshipObj._id = user._id
					friendshipObj.status = '2'
					friendship.push(friendshipObj)
					status = '2'
				}
			}
		}
		//test
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
			friendshipObj._id = user._id
			friendshipObj.status = '2'
			friendship.push(friendshipObj)
			let newReq2 = { _id: user._id, status: '2' as '2' }
			user.friendship.push(newReq1)
			friendUser.friendship.push(newReq2)
			const notifyToken = await this.notificationModel.findById(
				friendId.friendId.toString()
			)
			if (notifyToken) {
				await sendNotification(
					notifyToken.deviceToken,
					'They want to add you as a friend'
				)
			}
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
					friendshipObj._id = user._id
					friendshipObj.status = '3'
					friendship.push(friendshipObj)
					status = '3'
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
					status = '0'
				}
			}
			userIndexDelete !== undefined &&
				user.friendship.splice(userIndexDelete, 1)
			FriendIndexDelete !== undefined &&
				friendUser.friendship.splice(FriendIndexDelete, 1)
		}
		await user.save()
		await friendUser.save()
		//return friendUser
		return {
			email: friendUser.email,
			_id: friendUser._id,
			firstName: friendUser.firstName,
			lastName: friendUser.lastName,
			avatar: friendUser.avatar,
			friendship: friendship,
		}
	}
	async getAllFriend(id: string) {
		const user = await this.userModel.findById(id).exec()
		if (!user) throw new NotFoundException('User not found')
		let result = {
			friendship: await Promise.all(
				user.friendship.map(async (friend) => {
					//console.log(friend.status)
					let req = await this.userModel.findById(friend._id)
					let result = {
						friends: returnUserFields(req),
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

		return message
	}
	async addComment(
		id: string, //sentedUser
		data: { message: string; created: Date; userId: string }
	) {
		const sentedUser = await this.userModel.findById(id).exec()
		const user = await this.userModel.findById(data.userId).exec()
		//const friendUser = await this.userModel.findById(data.userId).exec()
		const date = new Date()
		//console.log(date)

		if (!user || !sentedUser) throw new NotFoundException('User not found')
		await this.userModel.updateOne(
			{ _id: data.userId, 'calendarPhotos.created': new Date(data.created) },
			{
				$push: {
					'calendarPhotos.$.comments': {
						_id: id,
						message: data.message,
						created: date,
					},
				},
			}
		)

		await user.save()
		return data.message
	}
	async getPostUserByLink(
		id: string, //sentedUser
		data: { created: string; userId: string }
	) {
		const user = await this.userModel.findById(data.userId)

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		const lastPhoto = user.calendarPhotos[user.calendarPhotos.length - 1] // Последнее фото пользователя

		if (!lastPhoto) {
			throw new Error('У пользователя нет фотографий')
		}

		// Проверяем, совпадает ли созданное время последнего фото с временной меткой из запроса
		//console.log(lastPhoto.created,data.created);
		if (
			new Date(lastPhoto.created).getTime() === new Date(data.created).getTime()
		) {
			// Если совпадает, то извлекаем комментарии к последнему фото
			const comments = lastPhoto.comments

			// Создаем массив для хранения обработанных комментариев
			const processedComments = []

			// Для каждого комментария извлекаем соответствующую информацию о пользователе и добавляем в массив processedComments
			for (const comment of comments) {
				const userComment = await this.userModel.findById(comment._id)
				if (userComment) {
					//	console.log(comment)

					processedComments.push({
						_id: userComment._id,
						avatar: userComment.avatar,
						//@ts-ignore
						created: comment.created,
						comment: comment.message,
						firstName: userComment.firstName,
					})
				}
			}

			return processedComments
		} else {
			throw new NotFoundException('last time is expired')
		}
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

	async addReaction(
		id: string, //sentedUser
		data: { created: string; userId: string; reaction: TReaction }
	) {
		const userByPhoto = await this.userModel.findById(data.userId).exec()
		if (!userByPhoto) return

		let latestsPhoto =
			userByPhoto.calendarPhotos[userByPhoto.calendarPhotos.length - 1]
		if (
			new Date(latestsPhoto.created).getTime() !==
			new Date(data.created).getTime()
		)
			return
		const newReaction = {
			created: new Date(),
			userId: id,
			reactionType: data.reaction,
		}

		let flag = false
		for (let i = 0; i < latestsPhoto.photoReactions.length; i++) {
			if (
				latestsPhoto.photoReactions[i].userId.toString() ===
				(id as {}).toString()
			) {
				latestsPhoto.photoReactions[i] = newReaction
				flag = true
				break
			}
		}
		if (!flag) {
			latestsPhoto.photoReactions.push(newReaction)
		}

		userByPhoto.markModified('calendarPhotos')
		await userByPhoto.save()

		const reactions = await this.getReaction({
			created: data.created,
			userId: data.userId,
		})

		return reactions
	}
	async getReaction(data: { created: string; userId: string }) {
		const userByPhoto = await this.userModel.findById(data.userId).exec()
		if (!userByPhoto) return

		let latestsPhoto =
			userByPhoto.calendarPhotos[userByPhoto.calendarPhotos.length - 1]

		if (
			new Date(latestsPhoto?.created).getTime() !==
			new Date(data.created).getTime()
		)
			return
		const reaction = []
		for (let i = 0; i < latestsPhoto.photoReactions.length; i++) {
			const user = await this.userModel.findById(
				latestsPhoto.photoReactions[i].userId
			)
			if (!user) continue
			const obj = {
				_id: user._id,
				avatar: user.avatar,
				reactionType: latestsPhoto.photoReactions[i].reactionType,
			}
			reaction.push(obj)
		}
		return reaction
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
const returnUserFields = (user: UserModel) => {
	return {
		_id: user._id,
		email: user.email,
		isAdmin: user.isAdmin,
		firstName: user.firstName,
		lastName: user.lastName,
		avatar: user.avatar,
		friendship: user.friendship,
		favoritePhotos: user.favoritePhotos,
		calendarPhotos: user.calendarPhotos,
		createdAt: user.createdAt,
		latestPhoto: user.calendarPhotos[user.calendarPhotos.length - 1] || null,
	}
}
